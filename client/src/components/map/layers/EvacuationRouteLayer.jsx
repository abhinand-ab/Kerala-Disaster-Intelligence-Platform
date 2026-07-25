import { useEffect, useRef, useMemo, memo } from "react";
import { Marker, Popup, Polyline, useMap as useLeafletMap } from "react-leaflet";
import L from "leaflet";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useMap } from "../../../context/MapContext";
import useShelters from "../../../hooks/useShelters";
import useIncidents from "../../../features/incidents/hooks/useIncidents";
import { getShelterStatus } from "../icons/shelterIcon";

// Helper to check if coordinates are valid
const isValidCoordinate = (lat, lng) => {
    if (lat === undefined || lat === null || lng === undefined || lng === null) return false;
    const latitude = Number(lat);
    const longitude = Number(lng);
    return !isNaN(latitude) && !isNaN(longitude) && latitude !== 0 && longitude !== 0;
};

// Distance helper (Haversine Formula)
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    const deg2rad = (deg) => deg * (Math.PI / 180);
    const R = 6371; // Earth radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Create a blue pulsing custom marker icon for User Position
const createUserIcon = () => {
    const html = `
    <div class="relative flex items-center justify-center w-8 h-8">
      <!-- Glow Ring -->
      <div class="absolute w-8 h-8 rounded-full bg-blue-500 opacity-35 animate-ping pointer-events-none"></div>
      
      <!-- Inner Solid Circle -->
      <div class="relative w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center">
        <!-- Center core -->
        <div class="w-2.5 h-2.5 rounded-full bg-white"></div>
      </div>
    </div>
  `;

    return L.divIcon({
        html,
        className: "custom-user-marker-container",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};

const EvacuationRouteLayer = () => {
    const map = useLeafletMap();
    const {
        userLocation,
        setUserLocation,
        navigationDest,
        setNavigationDest,
        activeRoute,
        setActiveRoute,
        routeInfo,
        setRouteInfo,
        setIsLocating,
        locateUser,
    } = useMap();

    const { shelters } = useShelters();
    const { incidents } = useIncidents();
    const hasMovedManually = useRef(false);
    const isFetchingRoute = useRef(false);

    // Monitor map movement
    useEffect(() => {
        if (!map) return;

        const handleMoveStart = (e) => {
            if (e.originalEvent || e.type === "dragstart" || e.type === "zoomstart") {
                hasMovedManually.current = true;
            }
        };

        map.on("dragstart", handleMoveStart);
        map.on("zoomstart", handleMoveStart);

        return () => {
            map.off("dragstart", handleMoveStart);
            map.off("zoomstart", handleMoveStart);
        };
    }, [map]);

    // Run location fetch once on Layer mounting
    useEffect(() => {
        if (!userLocation) {
            locateUser();
        }
    }, []);

    // Helper to re-route to next closest open shelter
    const navigateToNextNearestShelter = (currentLat, currentLng) => {
        if (!shelters || shelters.length === 0) {
            toast.error("No other shelters are currently registered.");
            setNavigationDest(null);
            setActiveRoute(null);
            setRouteInfo(null);
            return;
        }

        // Filter for open validation
        const suitableShelters = shelters.filter((s) => {
            const status = getShelterStatus(s);
            const hasCoords = isValidCoordinate(s.latitude, s.longitude);
            return hasCoords && (status === "Open" || status === "Nearly Full");
        });

        if (suitableShelters.length === 0) {
            toast.error("No safe, open, and vacancy available shelters found.");
            setNavigationDest(null);
            setActiveRoute(null);
            setRouteInfo(null);
            return;
        }

        // Find nearest
        let nearest = null;
        let minD = Infinity;

        suitableShelters.forEach((s) => {
            const dist = getDistanceKm(currentLat, currentLng, Number(s.latitude), Number(s.longitude));
            if (dist < minD) {
                minD = dist;
                nearest = s;
            }
        });

        if (nearest) {
            toast.success(`Automatically rerouting to: ${nearest.name} (${minD.toFixed(1)} km)`);
            setNavigationDest(nearest);
            hasMovedManually.current = false; // allow auto zoom on new route
        }
    };

    // Step 7/8: Watch active shelters list changes relative to our selected navigation destination
    useEffect(() => {
        if (!navigationDest || !shelters || shelters.length === 0) return;

        const latestShelter = shelters.find((s) => s._id === navigationDest._id);

        if (!latestShelter) {
            // Custom selected shelter was deleted/removed
            toast.error("Selected shelter is no longer available.");
            if (userLocation) {
                navigateToNextNearestShelter(userLocation[0], userLocation[1]);
            } else {
                setNavigationDest(null);
                setActiveRoute(null);
                setRouteInfo(null);
            }
            return;
        }

        const currentStatus = getShelterStatus(latestShelter);

        if (currentStatus === "Closed" || currentStatus === "Full") {
            // Selected shelter now closed or full
            toast.error(`Selected shelter "${latestShelter.name}" is now ${currentStatus.toLowerCase()}.`);
            if (userLocation) {
                navigateToNextNearestShelter(userLocation[0], userLocation[1]);
            } else {
                setNavigationDest(null);
                setActiveRoute(null);
                setRouteInfo(null);
            }
            return;
        }

        // Otherwise, details changed, sync navigationDest object values fields
        if (
            latestShelter.occupancy !== navigationDest.occupancy ||
            latestShelter.capacity !== navigationDest.capacity ||
            latestShelter.status !== navigationDest.status ||
            latestShelter.latitude !== navigationDest.latitude ||
            latestShelter.longitude !== navigationDest.longitude
        ) {
            setNavigationDest(latestShelter);
        }
    }, [shelters, navigationDest, userLocation]);

    // Step 4 & 5: Calculate Safe Route using OSRM Web Service
    useEffect(() => {
        if (!userLocation || !navigationDest || isFetchingRoute.current) {
            return;
        }

        const [userLat, userLng] = userLocation;
        const destLat = Number(navigationDest.latitude);
        const destLng = Number(navigationDest.longitude);

        if (!isValidCoordinate(userLat, userLng) || !isValidCoordinate(destLat, destLng)) {
            return;
        }

        const fetchRoute = async () => {
            isFetchingRoute.current = true;
            try {
                const url = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true&alternatives=true`;
                const res = await axios.get(url);

                if (res.data?.code !== "Ok" || !res.data?.routes || res.data?.routes.length === 0) {
                    toast.error("Could not calculate directory path to this shelter.");
                    return;
                }

                // Filter for active hazard/danger incidents in local area
                const criticalIncidents = (incidents || []).filter((i) => {
                    const category = i.category?.toLowerCase();
                    const severity = i.severity?.toLowerCase();
                    return (
                        (severity === "critical" || severity === "high") &&
                        (category === "flood" || category === "landslide" || category === "road block" || category === "rescue")
                    );
                });

                // Evaluate OSRM alternatives for safety
                const evaluatedRoutes = res.data.routes.map((r) => {
                    const coords = r.geometry.coordinates.map((c) => [c[1], c[0]]); // [lat, lng]
                    let warnings = 0;
                    let minDistanceToDisaster = Infinity;

                    coords.forEach(([lat, lng]) => {
                        criticalIncidents.forEach((inc) => {
                            const dist = getDistanceKm(lat, lng, inc.location.latitude, inc.location.longitude);
                            if (dist < minDistanceToDisaster) {
                                minDistanceToDisaster = dist;
                            }
                            if (dist < 0.5) { // 500 meters threshold
                                warnings++;
                            }
                        });
                    });

                    return {
                        route: r,
                        coords,
                        isSafe: warnings === 0,
                        warningCount: warnings,
                        minDistanceToDisaster,
                    };
                });

                // Sort: safe ones first, then fewest warnings, then shortest route length
                evaluatedRoutes.sort((a, b) => {
                    if (a.isSafe && !b.isSafe) return -1;
                    if (!a.isSafe && b.isSafe) return 1;
                    if (a.warningCount !== b.warningCount) return a.warningCount - b.warningCount;
                    return a.route.distance - b.route.distance;
                });

                const selected = evaluatedRoutes[0];
                setActiveRoute(selected.coords);

                const steps = selected.route.legs[0]?.steps || [];
                const instructions = steps.map((s) => {
                    let text = s.maneuver?.instruction;
                    if (!text) {
                        const type = s.maneuver?.type || "proceed";
                        const modifier = s.maneuver?.modifier || "";
                        const streetName = s.name ? `onto ${s.name}` : "";
                        text = `${type.toUpperCase()} ${modifier} ${streetName}`.trim();
                    }
                    return {
                        text,
                        distance: s.distance,
                        duration: s.duration,
                    };
                });

                setRouteInfo({
                    distance: selected.route.distance / 1000, // km
                    duration: selected.route.duration / 60, // mins
                    isSafe: selected.isSafe,
                    warningCount: selected.warningCount,
                    instructions,
                });

                if (!selected.isSafe) {
                    toast.warn("calculated route borders critical disaster incidents. Exercise high caution!");
                }

            } catch (err) {
                console.error("OSRM Route fetching error:", err);
                toast.error("Failed to retrieve directions path from routing host.");
            } finally {
                isFetchingRoute.current = false;
            }
        };

        fetchRoute();
    }, [userLocation, navigationDest, incidents]);

    // Fit bounds to show start, destination, and the complete route
    useEffect(() => {
        if (!map || hasMovedManually.current || !activeRoute || activeRoute.length === 0) return;

        try {
            map.fitBounds(activeRoute, { padding: [50, 50] });
        } catch (e) {
            console.warn("Could not fit route bounds:", e);
        }
    }, [activeRoute, map]);

    const userIconInstance = useMemo(() => createUserIcon(), []);

    return (
        <>
            {userLocation && isValidCoordinate(userLocation[0], userLocation[1]) && (
                <Marker position={userLocation} icon={userIconInstance}>
                    <Popup>
                        <div className="p-1.5 text-xs text-slate-800 font-sans">
                            <strong className="block text-sm text-cyan-600 font-semibold mb-1">Your Position</strong>
                            <span>Latitude: {userLocation[0].toFixed(5)}</span>
                            <br />
                            <span>Longitude: {userLocation[1].toFixed(5)}</span>
                            <button
                                type="button"
                                onClick={() => locateUser(true)}
                                className="mt-2 w-full inline-flex items-center justify-center gap-1 rounded bg-slate-100 hover:bg-slate-200 py-1 font-semibold text-slate-700 transition"
                            >
                                Recalibrate GPS
                            </button>
                        </div>
                    </Popup>
                </Marker>
            )}

            {activeRoute && activeRoute.length > 0 && (
                <Polyline
                    positions={activeRoute}
                    pathOptions={{
                        color: routeInfo?.isSafe ? "#2563eb" : "#ef4444",
                        weight: 6,
                        opacity: 0.85,
                        lineJoin: "round",
                        lineCap: "round",
                    }}
                />
            )}
        </>
    );
};

export default memo(EvacuationRouteLayer);
