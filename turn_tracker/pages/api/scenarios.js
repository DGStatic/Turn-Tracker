import clientPromise from '../../lib/mongodb'
import { ObjectId } from 'mongodb'

export default async (req, res) => {

    res.setHeader('Access-Control-Allow-Origin', 'https://turn-tracker.vercel.app')
	res.setHeader('Access-Control-Allow-Methods', 'POST,PUT,DELETE,OPTIONS')
	res.setHeader('Access-Control-Allow-Headers', '*')
	res.setHeader('Access-Control-Allow-Credentials', 'true')

    if (req.method === 'POST') {  
        const client = await clientPromise
        let db;
        let scenarios;
        try {
            db = client.db("TurnTrackerDB")
            scenarios = db.collection("scenarios")
        } catch (e) {
            console.error(e);
            res.status(500).json({message: "Database error. Please try again later."})
            return
        }

        const scenario = req.body
        var result;
        let rows;
        try {
            rows = JSON.parse(JSON.stringify(scenario))
        } catch (e) {
            console.error(e)
            res.status(400).json({ message: "Invalid request body."})
            return
        }

        try {
            const doc = {
                rows: rows
            }
            result = await scenarios.insertOne(doc)
        } catch (e) {
            console.error(e);
            res.status(400).json({message: "Scenario was not able to be stored."});
            return
        }
            res.status(201).json({id : result.insertedId})
            return

    } else if (req.method === 'PUT') {

        const client = await clientPromise
        let db;
        let scenarios;
        try {
            db = client.db("TurnTrackerDB")
            scenarios = db.collection("scenarios")
        } catch (e) {
            console.error(e)
            res.status(500).json({message: "Database Error. Please try again later."})
            return
        }

        let body;
        try {
            body = JSON.parse(JSON.stringify(req.body))
        } catch (e) {
            console.error(e)
            res.status(400).json({ message: "Invalid request body."})
            return
        }
	    const rows = body.rows
        const scenarioId = body.id

        try {
            const doc = {
                rows: rows
            }
            const query = { "_id" : new ObjectId(scenarioId) }
            const result = await scenarios.replaceOne(query, doc)
        } catch (e) {
            console.error(e)
	        res.status(400).json({ message: "Bad Data or Internal Database Error." })
            return
        }
            res.status(201).json({ message : 'scenario saved successfully!'})
            return

    } else if (req.method === 'DELETE') {

        const client = await clientPromise
	    let db;
        let scenarios;
        try {
            db = client.db("TurnTrackerDB")
            scenarios = db.collection("scenarios")
        } catch (e) {
            console.error(e)
            res.status(500).json({message: "Database Error. Please try again later."})
            return
        } 

        let scenarioId;
        try { 
            scenarioId = JSON.parse(JSON.stringify(req.body))
        } catch (e) {
            console.error(e)
            res.status(400).json({ message: "Invalid request body."})
            return
        }

        try {
            const query = { "_id" : new ObjectId(scenarioId) }
            const result = await scenarios.deleteOne(query)
        } catch (e) {
            console.error(e)
	        res.status(400).json({ message: "Bad Data or Internal Database Error." })
            return;
        }
            res.setHeader('Set-Cookie', 'scenarioId=0; Max-Age=0');
            res.status(200).json({message: "scenario deleted successfully!"})
            return

    } else if (req.method === 'OPTIONS') { 
        res.status(200).send("ok") 
        return
    } else { res.status(404).json({message: "Invalid request."}) }

}