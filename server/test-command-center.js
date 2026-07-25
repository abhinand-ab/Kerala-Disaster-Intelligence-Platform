import dotenv from "dotenv";
import connectDB from "./config/db.js";
import mongoose from "mongoose";
import * as coordService from "./services/coordinationService.js";
import Incident from "./models/Incident.js";
import Agency from "./models/Agency.js";
import CommandCenter from "./models/CommandCenter.js";

dotenv.config();

const runTest = async () => {
    try {
        console.log("🔄 Connecting to MongoDB...");
        await connectDB();
        console.log("✅ Database Connected.");

        // 1. Seed or retrieve an Agency
        let agency = await Agency.findOne();
        if (!agency) {
            console.log("🌱 No Agency found. Seeding default agencies...");
            await coordService.seedAgencies();
            agency = await Agency.findOne();
            if (!agency) {
                throw new Error("Unable to seed or retrieve agency for testing.");
            }
        }
        console.log(`ℹ️ Using Test Agency: "${agency.agencyName}" [ID: ${agency._id}]`);

        // 2. Retrieve or create a mock Incident
        let incident = await Incident.findOne();
        if (!incident) {
            console.log("🌱 No Incident found. Creating a mock testing incident...");
            incident = new Incident({
                title: "Test Inflow Flooding",
                description: "Temporary testing incident for coordination validation.",
                category: "Flood",
                severity: "Medium",
                status: "Reported",
                location: {
                    latitude: 10.8505,
                    longitude: 76.2711,
                    district: "Wayanad",
                    address: "Kalpetta Coordinate Center"
                }
            });
            await incident.save();
        }
        console.log(`ℹ️ Using Incident: "${incident.title}" [ID: ${incident._id}]`);

        // 3. Create a Command Center
        console.log("\n🚀 Testing commandCenter creation...");
        const room = await coordService.createCommandCenter({
            incidentId: incident._id,
            commander: "Test Commander General",
            objectives: ["Evacuate Sector A", "Reinforce river bunds"],
            participatingAgencyIds: [agency._id]
        });
        console.log("✅ Command Center established successfully!");
        console.log(`   Commander: ${room.assignedCommander}`);
        console.log(`   Objectives: ${room.objectives.join(", ")}`);
        console.log(`   Participating Agencies Count: ${room.participatingAgencies.length}`);

        // 4. Join another agency (or same one to test idempotent joining logic)
        console.log("\n🛡️ Testing joinAgency command...");
        const joinedRoom = await coordService.joinAgency(room._id, agency._id);
        console.log(`✅ joinedRoom participating agencies: ${joinedRoom.participatingAgencies.length}`);

        // 5. Test post message in command line thread
        console.log("\n💬 Testing postCommandMessage...");
        const msg = await coordService.postCommandMessage(room._id, "Officer Bob", agency._id, "Wind speeds increasing, preparing rescue vehicles.");
        console.log(`✅ Message posted successfully by: ${msg.sender} -> "${msg.message}"`);

        // 6. Test share resource to pool
        console.log("\n📦 Testing shareResource...");
        const resourceSharedRoom = await coordService.shareResource(room._id, {
            resourceType: "Vehicle",
            name: "Rescue Boats (Inflatable)",
            fromAgencyId: agency._id,
            details: "Yamaha 15HP outboard engine, capacity 8 per boat",
            quantity: 3
        });
        console.log(`✅ sharedResources count in DB: ${resourceSharedRoom.sharedResources.length}`);

        // 7. Verify overall availability compilation
        console.log("\n📊 Testing getAgencyAvailability summary stats...");
        const availability = await coordService.getAgencyAvailability();
        console.log("✅ Compiled Availability Summary metrics successfully:");
        console.log(JSON.stringify(availability.summarizedAvailability, null, 2));

        // 8. Clean up test database command room
        console.log("\n🗑️ Cleaning up command room doc...");
        await CommandCenter.deleteOne({ _id: room._id });
        console.log("✅ CommandCenter document safely deleted from MongoDB.");

        console.log("\n🌟 INTEGRATION TESTS PASSED SUCCESSFULLY! EVERYTHING WORKS GREAT!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Test crashed with error:", err.message);
        process.exit(1);
    }
};

runTest();
