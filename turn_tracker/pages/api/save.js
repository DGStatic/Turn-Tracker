
export default function handler(req, res) {
    if (req.method === 'POST') {
        const scenario = req.body
        res.status(201).json(scenario)
    }

  }