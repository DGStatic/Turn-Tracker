import { MongoClient, ObjectId } from 'mongodb'
import clientPromise from '../../../lib/mongodb'

export default async (req, res) => {

    if (req.method === 'POST') {

        const client = await clientPromise
        const db = client.db("TurnTrackerDB")
        let scenarios = db.collection("scenarios")

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
        }
        res.status(201).json({id : result.insertedId})

    } else { res.status(404).json({message: "invalid request"}) }
    
}