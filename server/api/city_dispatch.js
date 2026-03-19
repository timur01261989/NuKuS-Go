
import { withAuth } from "../_shared/withAuth.js"

async function handler(req,res){
 const city=req.query.city||"default"
 res.json({city,dispatch:"active"})
}

export default withAuth(handler)
