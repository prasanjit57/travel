const express=require("express");
const app=express();
const mongoose=require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const Review = require("./models/review.js");
const session = require('express-session');
const MongoStore = require('connect-mongo');
// const passport = require("passport");
// const  LocalStrategy = require("passport-local");
// const User = require("./models/user.js");
const ExpressError = require("./utils/ExpressError.js");
const{ listingSchema } = require("./schema.js");
require('dotenv').config();

// const MONGO_URL = "mongodb://localhost:27017/travelmate";
const dbUrl = process.env.ATLASDB_URL;

main()
    .then(() => {
        console.log("connected to db");
    })
    .catch((err) => {
        console.log(err);
    })

async function main() {
    await mongoose.connect(dbUrl);
}

const objectId = new mongoose.Types.ObjectId();
const objectIdString = objectId.toString();  // Converts ObjectId to a string

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 *  60 * 60, // 1 day

});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,

    },
};

store.on("error", () => {
    console.log("Error in mongo session");
})

app.set("view engine", "ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname,"/public")));
app.use(express.static('public'));
app.use('/styles.css', express.static(__dirname + '/styles.css'));


app.use(session({
    secret: 'your_secret_key_here',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  }));


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});



app.get("/listings",wrapAsync(async(req,res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs",{ allListings});
}));

const validateListing = (req,res,next) => {
    let {error} = listingSchema.validate(req.body);
    if(error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw  new ExpressError(400,result.error);

    }else{
        next();
    }
}

// //new route
// app.get("/listings/new",wrapAsync(async(req,res) => {
//     res.render("listings/new.ejs");
// }));

// show route
app.get("/listings/:id",wrapAsync(async(req,res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    res.render("listings/show.ejs",{listing});

}));

//create route
app.post(
    "/listings",
    validateListing,
    wrapAsync(async(req,res,next) => {
    
    const newListing = new Listing(req.body.listing);
    await  newListing.save();
    res.redirect("/listings");
})
);

// //edit route
// app.get("/listings/:id/edit",wrapAsync(async(req,res) => {
//     let { id } = req.params;
//     const listing = await Listing.findById(id);
//     res.render("listings/edit.ejs",{listing});
// }));

// //update route
// app.put("/listings/:id",validateListing,wrapAsync(async(req,res) => {
//     if (!req.body.listing) {
//         throw new ExpressError(400,"send valid data for listing");
//     }
//     let { id } = req.params;
//     await Listing.findByIdAndUpdate(id, { ...req.body.listing});
//     res.redirect(`/listings/${id}`);
// }));

// // delete route
// app.delete("/listings/:id",wrapAsync(async(req,res) => {
//     let { id } = req.params;
//     let deletedListing = await Listing.findByIdAndDelete(id);
//     console.log(deletedListing);
//     res.redirect("/listings");
// }));

// reviews
// post route
app.post("/listings/:id/reviews",wrapAsync(async (req,res)=> {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);

    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();

    res.redirect(`/listings/${listing._id}`);
}));

app.all("*",(req,res,next) => {
    next(new ExpressError(404,"Page not Found"));
});

app.use((err,req,res,next) => {
    let { statusCode = 500 , message = "Something went wrong!"} = err;
    res.status(statusCode).render("error.ejs",{ message });
});

app.listen(8080,() => {
    console.log("server is listening");
})