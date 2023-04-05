import { MongoClient, ObjectId } from 'mongodb'
import clientPromise from '../../../lib/mongodb'

export default async (req, res) => {
	
	res.setHeader('Access-Control-Allow-Origin', 'https://turn-tracker.vercel.app')
	res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
	res.setHeader('Access-Control-Allow-Headers', '*')
	//res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
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
            res.status(201).json({id : result.insertedId})

    } else if (req.method === 'OPTIONS') { 
	    res.status(200).send("ok") 
    } else { res.status(404).json({message: "Invalid request."}) }
    
}
