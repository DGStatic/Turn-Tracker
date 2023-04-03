import { MongoClient, ObjectId } from 'mongodb'
import clientPromise from '../../../lib/mongodb'

export default async (req, res) => {

    if (req.method === 'GET') {
        const client = await clientPromise
	    let db;
	    let scenarios;
        try {
            db = client.db("TurnTrackerDB")
            scenarios = db.collection("scenarios")
        } catch (e) {
            console.error(e)
            res.status(500).json({message: "Database Error. Please try again later."})
        }	
        const scenarioId = req.query.id
        let result = null;
        try {
            const query = { "_id" : new ObjectId(scenarioId) }
            result = await scenarios.findOne(query)
        } catch (e) {
            console.error(e)
	        res.status(400).json({ message: "Bad data or Internal Database Error." })
        }
            res.status(200).json(result)

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
        }

	    const rows = req.body
        const scenarioId = req.query.id
        try {
            const doc = {
                rows: rows
            }
            const query = { "_id" : new ObjectId(scenarioId) }
            const result = await scenarios.replaceOne(query, doc)
        } catch (e) {
            console.error(e)
	        res.status(400).json({ message: "Bad Data or Internal Database Error." })
        }
            res.status(201).json({ message : 'scenario saved successfully!'})

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
        } 

        const scenarioId = req.query.id
        try {
            const query = { "_id" : new ObjectId(scenarioId) }
            const result = await scenarios.deleteOne(query)
        } catch (e) {
            console.error(e)
	        res.status(400).json({ message: "Bad Data or Internal Database Error." })
        }
            res.setHeader('Set-Cookie', 'scenarioId=0; Max-Age=0');
            res.status(200).json({message: "scenario deleted successfully!"})

    } else { res.status(404).json({message: "invalid request"}) }

}
