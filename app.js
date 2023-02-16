//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('strictQuery', false);
mongoose.connect("mongodb://localhost:27017/todolistDb");

const itemsSchema = {
  name: String
}

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todo list"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<--Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const ListSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", ListSchema);



app.get("/", function(req, res) {


  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0)
    {
      Item.insertMany(defaultItems, function(err) {
        if (err)
        {
          console.log('err = ', err);
        }
      
        else {
          console.log('Successfully store the default array in database');
        }
      });

      res.redirect("/");
    }
    else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
    
  })
  

});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList) {
    if (!err)
    {
      if (!foundList)
      {
        const customList = new List({
          name: customListName,
          items: defaultItems
        });
        customList.save();
        res.redirect("/" + customListName);
      }
      else {
        
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        
      }
    }
  });
  

  
});

app.post("/", function(req, res){

  const newItem = req.body.newItem;
  const ListName = req.body.list;

  const item = new Item({
    name: newItem
  });

  if (ListName === "Today")
  {
    item.save();
    res.redirect("/");
  }

  else {
    console.log('ListName = ', ListName);
    List.findOne({name: ListName}, function(err, foundList) {
      
      console.log('founditems = ', foundList);
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + ListName);
    })
  }

  
  
});

app.post("/delete", function(req, res) {
  const item_id = req.body.checkbox;
  const listTitle = req.body.listName;

  if (listTitle === "Today")
  {
    Item.findByIdAndRemove(item_id, function(err) {
      if (!err)
      {
        console.log('Successfully deleted checked item.');
        res.redirect("/");
      }
    })
  }

  else {
    console.log('listTitle = ', listTitle);
    List.findOneAndUpdate({name: listTitle}, {$pull: {items: {_id: item_id}}}, function(err, foundList) {
      if (!err)
      {
        res.redirect('/' + listTitle);
      }
    });
  }

})

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
