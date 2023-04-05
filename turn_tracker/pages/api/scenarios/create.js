import { MongoClient, ObjectId } from 'mongodb'
import clientPromise from '../../../lib/mongodb'

export default async (req, res) => {

    if (req.method === 'POST') {
        const client = await clientPromise
        let db;
        let scenarios;
        try {
            db = client.db("TurnTrackerDB")
            scenarios = db.collection("scenarios")
        } catch (e) {
            console.error(e);
        }
	    res.setHeader('Access-Control-Allow-Origin', 'https://turn-tracker.vercel.app')
            res.status(500).json({message: "Database error. Please try again later."})
        }
        const scenario = req.body
        var result;
        const rows = JSON.parse(JSON.stringify(scenario))
        try {
            const doc = {
                rows: rows
            }
            result = await scenarios.insertOne(doc)
        } catch (e) {
            console.error(e);
            res.status(400).json({message: "Scenario was not able to be stored."});
        }
	    res.setHeader('Access-Control-Allow-Origin', 'https://turn-tracker.vercel.app')
            res.status(201).json({id : result.insertedId})

    } else { res.status(404).json({message: "Invalid request."}) }
    
}
