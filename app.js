const express=require("express");
const app=express();
const mongoose=require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const Review = require("./models/review.js");


const MONGO_URL = "mongodb://localhost:27017/travelmate";

main()
    .then(() => {
        console.log("connected to db");
    })
    .catch((err) => {
        console.log(err);
    })

async function main() {
    await mongoose.connect(MONGO_URL);
}

const objectId = new mongoose.Types.ObjectId();
const objectIdString = objectId.toString();  // Converts ObjectId to a string



app.set("view engine", "ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

// app.get("/",(req,res) =>{
//     res.send("hi i am root");
// })



app.get("/listings",async(req,res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs",{ allListings});
});

//new route
app.get("/listings/new",(req,res) => {
    res.render("listings/new.ejs");
});

// show route
app.get("/listings/:id",async(req,res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    res.render("listings/show.ejs",{listing});

});

//create route
app.post("/listings",async(req,res,next) => {
try{
    const newListing = new Listing(req.body.listing);
    await  newListing.save();
    res.redirect("/listings");
}catch(err){
    next(err);
}
});

//edit route
app.get("/listings/:id/edit",async(req,res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs",{listing});
})

//update route
app.put("/listings/:id",async(req,res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing});
    res.redirect(`/listings/${id}`);
})

// delete route
app.delete("/listings/:id",async(req,res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
});

// reviews
// post route
app.post("/listings/:id/reviews",async (req,res)=> {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);

    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();

    res.redirect(`/listings/${listing._id}`);
})


app.use((err,req,res,next) => {
    res.send("Something went wrong!");
});

app.listen(8080,() => {
    console.log("server is listening");
})