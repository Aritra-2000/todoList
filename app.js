//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');
const Schema = mongoose.Schema;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://Aritra:Test123@cluster0.nxosm3a.mongodb.net/todolistDB', {useNewUrlParser: true});

const itemsSchema = new Schema ({
  name: String
});

const Item = mongoose.model("Item", itemsSchema	);

const item1 = new Item ({
  name: "Welcome to your todolist!"
});

const item2 = new Item ({
  name: "Hit the + button to add a new item."
});

const item3 = new Item ({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1,item2,item3];

const listSchema = new Schema ({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find().then(function (foundItems) {

      if (foundItems.length === 0){
        Item.insertMany(defaultItems).then(function(){
          console.log("Succesfully saved in default items in todolistDB");
        }).catch(function(err){
          console.log(err);
        });
        res.redirect("/");
      }else{
          res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
    });
});


app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);


 List.findOne({name: customListName}).then((foundList) => {

   if(!foundList){
   // creating new listTitle
   const list = new List({
     name: customListName,
     items: defaultItems
   });

   list.save();
   res.redirect("/" + customListName);

 } else {
      //show an existing list
      res.render("list", {listTitle: foundList.name , newListItems: foundList.items});
    }
  }).catch((err) =>{
    res.status(400).send("Bad Request")
  });
});

app.post("/", function(req, res){

  const itemName =  req.body.ListName;
  const listName =  req.body.list;

 const item = new Item ({
   name: itemName
 });

 if (listName === "Today"){
    item.save();
    res.redirect("/");
 } else {
    List.findOne({name: listName}).then((foundList) => {
    foundList.items.push(item);
    foundList.save();
    res.redirect("/" + listName);
   });
 }
});


app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){

  Item.findByIdAndRemove(checkedItemId).then(function(err) {
    if(!err){
      console.log("Successfully deleted check item!");
      res.redirect("/");
    }
  });
 } else {
     List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then((foundList) => {
       res.redirect("/" + listName);
     });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3009, function() {
  console.log("Server started Succesfully.");
});
