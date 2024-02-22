import UserModel from "../model/User.model.js"
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import ENV from "../config.js"
import otpGenerator from 'otp-generator'


export async function verifyUser(req,res,next){
    try {
        const {username} = req.method == "GET" ? req.query : req.body;

        // check the user existance
        let exist = await UserModel.findOne({username});
        if(!exist) return res.status(404).send({error:"Can't fing user !"});
        next();

    } catch (error) {
       return res.status(404).send({error:"Authentication Error"}); 
    }
}


/** POST: http://localhost:8080/api/register 
 * @param : {
  "username" : "example12",
  "password" : "admin12",
  "email": "example@gmail.com",
  "firstName" : "bill",
  "lastName": "william",
  "mobile": 8009860560,
  "address" : "Apt. 556, Kulas Light, Gwenborough",
  "profile": ""
}
*/
export async function register(req,res){

    try {
        const {username , password, profile , email} =req.body;
        // Check for existing username
         // Check for existing username
         const existUsername = await UserModel.findOne({ username });
         if (existUsername) {
             return res.status(400).send({ error: "Please provide a unique username" });
         }
 
         // Check for existing email
         const existEmail = await UserModel.findOne({ email });
         if (existEmail) {
             return res.status(400).send({ error: "Please provide a unique email" });
         }

        Promise.all([existUsername,existEmail])

        .then(()=>{
            if(password){
                bcrypt.hash(password,10)
                .then(hashedPassword => {
                    const user = new  UserModel ({
                        username,
                        password : hashedPassword,
                        profile : profile || '',
                        email
                    });

                    // return save as a response
                    user.save()
                    .then(result => res.status(201).send({msg : "User register successfully"}))
                    .catch(error =>res.status(500).send({error: error.message}))

                }).catch(error =>{
                    return res.status(500).send({
                        error : "Enable to hashed password"
                    })  
                })
            }
        }).catch(error =>{
            return res.status(500).send({error: error.message})
        })

    } catch (error) {
        return res.status(500).send(error);
    }
}

export async function login(req,res){
    const { username, password} = req.body;
    try {
        UserModel.findOne({ username })
            .then(user =>{
                bcrypt.compare(password,user.password)
                .then(passwordCheck =>{
                    if(!passwordCheck) return res.status(404).send({error:" do not have password"}); 
                    // create jwt token
                        const token =  jwt.sign({
                            userId:user._id,
                            username:user.username,
                            },ENV.JWT_SECRET, {expiresIn : "24h"});
                        return res.status(200).send({
                            msg:"Login Successfull... !",
                            username : user.username,
                            token
                        })
                })
                .catch(error =>{
                    return res.status(404).send({error:"password do not matched"}); 
                })
            })
            .catch(error =>{
                return res.status(404).send({error:"username not found"}); 
            })
    } catch (error) {
        return res.status(500).send(error);
    }

}

export async function getUser(req, res) {
    const { username } = req.params;
    try {
        const user = await UserModel.findOne({ username });
        if (!user) {
            return res.status(404).send({ error: "User not found" });
        }
        return res.status(200).send(user);
    } catch (error) {
        return res.status(500).send({ error: "Internal Server Error" });
    }
}

export async function updateUser(req, res) {
    try {
        const id = req.query.id;
        if (id) {
            const body = req.body;
            // Update the data
            const result = await UserModel.updateOne({ _id: id }, body);
            if (result.nModified === 0) {
                return res.status(404).send({ error: "User not found" });
            }
            return res.status(201).send({ msg: "Record updated successfully" });
        } else {
            return res.status(400).send({ error: "User ID not provided" });
        }
    } catch (error) {
        return res.status(500).send({ error: "Internal Server Error" });
    }
}


export async function generateOTP(req,res){
    req.app.locals.OTP = await otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false})
    res.status(201).send({ code: req.app.locals.OTP })
}

/** GET: http://localhost:8080/api/verifyOTP */
export async function verifyOTP(req,res){
    const { code } = req.query;
    if(parseInt(req.app.locals.OTP) === parseInt(code)){
        req.app.locals.OTP = null; // reset the OTP value
        req.app.locals.resetSession = true; // start session for reset password
        return res.status(201).send({ msg: 'Verify Successsfully!'})
    }
    return res.status(400).send({ error: "Invalid OTP"});
}


// successfully redirect user when OTP is valid
/** GET: http://localhost:8080/api/createResetSession */
export async function createResetSession(req,res){
   if(req.app.locals.resetSession){
        return res.status(201).send({ flag : req.app.locals.resetSession})
   }
   return res.status(440).send({error : "Session expired!"})
}


// update the password when we have valid session
/** PUT: http://localhost:8080/api/resetPassword */
export async function resetPassword(req,res){
    try {
        
        if(!req.app.locals.resetSession) return res.status(440).send({error : "Session expired!"});

        const { username, password } = req.body;

        try {
            
            UserModel.findOne({ username})
                .then(user => {
                    bcrypt.hash(password, 10)
                        .then(hashedPassword => {
                            UserModel.updateOne({ username : user.username },
                            { password: hashedPassword}, function(err, data){
                                if(err) throw err;
                                req.app.locals.resetSession = false; // reset session
                                return res.status(201).send({ msg : "Record Updated...!"})
                            });
                        })
                        .catch( e => {
                            return res.status(500).send({
                                error : "Enable to hashed password"
                            })
                        })
                })
                .catch(error => {
                    return res.status(404).send({ error : "Username not Found"});
                })

        } catch (error) {
            return res.status(500).send({ error })
        }

    } catch (error) {
        return res.status(401).send({ error })
    }
}