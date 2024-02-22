import { Router } from "express";
const router = Router();


 //import all controllers 
 import * as controller from '../controllers/appController.js'
 import { registerMail } from "../controllers/mailer.js";
import Auth , {localVariables} from "../middleware/auth.js"

// Post method
router.route('/register').post(controller.register);         //register route
router.route('/registerMail').post(registerMail); // send the email
router.route('/authenticate').post((req,res)=>res.end()); // authenticate user
router.route('/login').post(controller.verifyUser,controller.login)    // login in app


//get method

router.route('/user/:username').get(controller.getUser) //user with username
router.route('/generateOTP').get(controller.verifyUser,localVariables, controller.generateOTP)  //generate random otp
router.route('/verifyOTP').get(controller.verifyOTP) //verify generated otp
router.route('/createResetSession').get(controller.createResetSession)   //reset all the variables


//put method
router.route('/updateuser').put(Auth,controller.updateUser); //is use to update user profile
router.route('/resetPassword').put(controller.verifyUser ,controller.resetPassword);   //use to rerset password


export default router;