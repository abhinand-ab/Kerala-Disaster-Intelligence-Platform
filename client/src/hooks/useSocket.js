import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { socket, connectSocket, disconnectSocket } from "../services/socket.js";

// Reusable Socket.IO hook for subscribing to server-side events.
const useSocket = () => {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	useEffect(() => {
		// Ensure the shared socket is connected when the hook is mounted.
		connectSocket();

		const handleConnect = () => {
			if (user?._id) {
				socket.emit("join", user._id);
			}
		};

		if (socket.connected) {
			handleConnect();
		}

		socket.on("connect", handleConnect);

		return () => {
			socket.off("connect", handleConnect);
		};
	}, [user?._id]);

	useEffect(() => {
		const refreshIncidents = () => {
			queryClient.invalidateQueries({
				queryKey: ["incidents"],
			});
		};

		const refreshNotifications = () => {
			queryClient.invalidateQueries({
				queryKey: ["notifications"],
			});
		};

		const refreshShelters = () => {
			queryClient.invalidateQueries({
				queryKey: ["shelters"],
			});
		};

		const refreshVolunteers = () => {
			queryClient.invalidateQueries({
				queryKey: ["volunteers"],
			});
		};

		const refreshResources = () => {
			queryClient.invalidateQueries({ queryKey: ["resources"] });
		};

		const refreshWarehouses = () => {
			queryClient.invalidateQueries({ queryKey: ["warehouses"] });
		};

		const refreshDeliveries = () => {
			queryClient.invalidateQueries({ queryKey: ["deliveries"] });
		};

		const refreshShelterInventories = () => {
			queryClient.invalidateQueries({ queryKey: ["shelterInventories"] });
			queryClient.invalidateQueries({ queryKey: ["shelterInventory"] });
		};

		const refreshVehicles = () => {
			queryClient.invalidateQueries({ queryKey: ["vehicles"] });
		};

		const refreshEmergencies = () => {
			queryClient.invalidateQueries({ queryKey: ["emergency"] });
		};

		const refreshSensors = () => {
			queryClient.invalidateQueries({ queryKey: ["sensors"] });
			queryClient.invalidateQueries({ queryKey: ["risk"] });
		};

		const handleNotificationCreated = (notification) => {
			toast.success(notification?.title || "New notification received.");
			refreshNotifications();
		};

		const refreshWeather = () => {
			queryClient.invalidateQueries({ queryKey: ["weather"] });
		};

		const handleWeatherAlertCreated = ({ district, alert }) => {
			toast.error(`🚨 Weather Alert for ${district}: ${alert.type} (${alert.severity}) - ${alert.message}`, { duration: 7000 });
			refreshWeather();
		};

		const handleWeatherAlertCleared = ({ district, alertType }) => {
			toast.success(`✅ Weather Alert Cleared for ${district}: ${alertType}`);
			refreshWeather();
		};

		socket.on("weatherUpdated", refreshWeather);
		socket.on("weatherAlertCreated", handleWeatherAlertCreated);
		socket.on("weatherAlertCleared", handleWeatherAlertCleared);

		socket.on("sensorUpdated", refreshSensors);
		socket.on("sensorOffline", (payload) => {
			toast.error(`🔌 Device offline: Sensor ${payload.sensorName} has lost connection!`);
			refreshSensors();
		});
		socket.on("sensorRecovered", (payload) => {
			toast.success(`🟢 Device Restored: Sensor ${payload.sensorName} is transmitting telemetry!`);
			refreshSensors();
		});
		socket.on("floodThresholdExceeded", (payload) => {
			toast.error(`🚨 FLOOD HAZARD: District ${payload.district} level reads ${payload.level}m!`, { duration: 8000 });
			refreshSensors();
		});
		socket.on("waterLevelUpdated", refreshSensors);
		socket.on("rainfallSensorUpdated", refreshSensors);

		socket.on("emergencyCreated", (req) => {
			toast(`🚨 SOS Alert: ${req.citizenName} in ${req.district} needs help!`, { duration: 6000 });
			refreshEmergencies();
		});
		socket.on("emergencyUpdated", refreshEmergencies);
		socket.on("emergencyAssigned", refreshEmergencies);
		socket.on("emergencyResolved", refreshEmergencies);
		socket.on("emergencyLocationUpdated", refreshEmergencies);

		socket.on("incidentCreated", refreshIncidents);
		socket.on("incidentUpdated", refreshIncidents);
		socket.on("incidentDeleted", refreshIncidents);
		socket.on("incidentAssigned", refreshIncidents);
		socket.on("incidentStatusUpdated", refreshIncidents);

		socket.on("notificationCreated", handleNotificationCreated);

		socket.on("shelterCreated", refreshShelters);
		socket.on("shelterUpdated", refreshShelters);
		socket.on("shelterDeleted", refreshShelters);
		socket.on("occupancyUpdated", refreshShelters);

		socket.on("volunteerCreated", refreshVolunteers);
		socket.on("volunteerUpdated", refreshVolunteers);
		socket.on("volunteerDeleted", refreshVolunteers);
		socket.on("volunteerAssigned", refreshVolunteers);
		socket.on("volunteerLocationUpdated", refreshVolunteers);
		socket.on("volunteerStatusUpdated", refreshVolunteers);

		socket.on("resourceCreated", refreshResources);
		socket.on("resourceUpdated", refreshResources);
		socket.on("resourceDeleted", refreshResources);
		socket.on("stockUpdated", refreshResources);
		socket.on("warehouseUpdated", refreshWarehouses);
		socket.on("deliveryStarted", () => {
			refreshDeliveries();
			refreshWarehouses();
			refreshResources();
		});
		socket.on("deliveryCompleted", () => {
			refreshDeliveries();
			refreshShelterInventories();
			refreshWarehouses();
			refreshResources();
		});
		socket.on("deliveryUpdated", refreshDeliveries);
		socket.on("deliveryDeleted", refreshDeliveries);

		// Vehicles
		socket.on("vehicleCreated", () => { refreshVehicles(); refreshIncidents(); });
		socket.on("vehicleUpdated", () => { refreshVehicles(); refreshIncidents(); });
		socket.on("vehicleDeleted", () => { refreshVehicles(); refreshIncidents(); });
		socket.on("vehicleAssigned", () => { refreshVehicles(); refreshIncidents(); });
		socket.on("vehicleLocationUpdated", refreshVehicles);
		socket.on("vehicleMissionCompleted", () => { refreshVehicles(); refreshIncidents(); });
		socket.on("vehicleStatusUpdated", () => { refreshVehicles(); refreshIncidents(); });

		// Multi-Agency Command Center Events
		const refreshCommandCenter = () => {
			queryClient.invalidateQueries({ queryKey: ["commandCenters"] });
		};

		socket.on("commandCenterCreated", (payload) => {
			toast.success(`🏢 New Multi-Agency Command established!`);
			refreshCommandCenter();
		});
		socket.on("agencyJoined", (payload) => {
			toast.success(`🛡️ Agency Joined: ${payload.agency?.agencyName || "New agency"} joined the command center.`);
			refreshCommandCenter();
		});
		socket.on("missionAssigned", (payload) => {
			toast.success(`🎯 Mission Dispatched: "${payload.mission?.missionName}"`);
			refreshCommandCenter();
		});
		socket.on("missionUpdated", () => refreshCommandCenter());
		socket.on("resourceShared", () => refreshCommandCenter());
		socket.on("commandMessage", () => refreshCommandCenter());

		// AI Decisions
		const refreshAI = () => {
			queryClient.invalidateQueries({ queryKey: ["ai"] });
		};

		socket.on("aiRecommendationCreated", (payload) => {
			toast(`🤖 AI Decision Engine: Generated ${payload.count || 1} new suggestions for ${payload.targetType}!`, { icon: "🤖" });
			refreshAI();
		});
		socket.on("predictionUpdated", () => {
			refreshAI();
		});
		socket.on("resourceOptimizationUpdated", () => {
			refreshAI();
		});

		return () => {
			socket.off("weatherUpdated", refreshWeather);
			socket.off("weatherAlertCreated", handleWeatherAlertCreated);
			socket.off("weatherAlertCleared", handleWeatherAlertCleared);

			socket.off("sensorUpdated", refreshSensors);
			socket.off("sensorOffline");
			socket.off("sensorRecovered");
			socket.off("floodThresholdExceeded");
			socket.off("waterLevelUpdated", refreshSensors);
			socket.off("rainfallSensorUpdated", refreshSensors);

			socket.off("emergencyCreated");
			socket.off("emergencyUpdated", refreshEmergencies);
			socket.off("emergencyAssigned", refreshEmergencies);
			socket.off("emergencyResolved", refreshEmergencies);
			socket.off("emergencyLocationUpdated", refreshEmergencies);

			socket.off("incidentCreated", refreshIncidents);
			socket.off("incidentUpdated", refreshIncidents);
			socket.off("incidentDeleted", refreshIncidents);
			socket.off("incidentAssigned", refreshIncidents);
			socket.off("incidentStatusUpdated", refreshIncidents);

			socket.off("notificationCreated", handleNotificationCreated);

			socket.off("shelterCreated", refreshShelters);
			socket.off("shelterUpdated", refreshShelters);
			socket.off("shelterDeleted", refreshShelters);
			socket.off("occupancyUpdated", refreshShelters);

			socket.off("volunteerCreated", refreshVolunteers);
			socket.off("volunteerUpdated", refreshVolunteers);
			socket.off("volunteerDeleted", refreshVolunteers);
			socket.off("volunteerAssigned", refreshVolunteers);
			socket.off("volunteerLocationUpdated", refreshVolunteers);
			socket.off("volunteerStatusUpdated", refreshVolunteers);

			socket.off("resourceCreated", refreshResources);
			socket.off("resourceUpdated", refreshResources);
			socket.off("resourceDeleted", refreshResources);
			socket.off("stockUpdated", refreshResources);
			socket.off("warehouseUpdated", refreshWarehouses);
			socket.off("deliveryStarted");
			socket.off("deliveryCompleted");
			socket.off("deliveryUpdated", refreshDeliveries);
			socket.off("deliveryDeleted", refreshDeliveries);

			// Vehicles
			socket.off("vehicleCreated");
			socket.off("vehicleUpdated");
			socket.off("vehicleDeleted");
			socket.off("vehicleAssigned");
			socket.off("vehicleLocationUpdated", refreshVehicles);
			socket.off("vehicleMissionCompleted");
			socket.off("vehicleStatusUpdated");

			// AI Decisions
			socket.off("aiRecommendationCreated");
			socket.off("predictionUpdated");
			socket.off("resourceOptimizationUpdated");

			// Command Center
			socket.off("commandCenterCreated");
			socket.off("agencyJoined");
			socket.off("missionAssigned");
			socket.off("missionUpdated");
			socket.off("resourceShared");
			socket.off("commandMessage");

			disconnectSocket();
		};
	}, [queryClient]);

	return socket;
};

export default useSocket;
