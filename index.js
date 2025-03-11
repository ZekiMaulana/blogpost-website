import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;

app.use(express.static("public"));


app.use(bodyParser.urlencoded({ extended: true }));

function processPost(title, desc, process, postId=""){
    var date = new Date().toDateString();
    var ranNum = Math.floor(Math.random() * 9) + 1;
    var imgName = "image"+ranNum+".jpg";
    const text = title + "/n " + imgName + "/n " + date +  "/n " + desc;
    const fileNames = searchFile()['fileNames'];
    const length = fileNames.length;
    var fileName = "";
    var checkFile= [];

    if (process === "input"){
        fileName = "post"+ (length+1) +".txt";
        for(var i=0; i<length-1;i++){
            if(fileNames[i] === fileName){
                checkFile.push(fileName)
            }
        } 
    } else {
        fileName = postId;
    }

    if (checkFile.length === 0){
        fs.writeFile(__dirname + "/public/article/"+ fileName , text, (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
    } else {
        console.log("has the same title")
    }
};

function searchFile(postId=false){
    var listOfArticle = fs.readdirSync(__dirname + "/public/article/");
    var textFile = [];
    if (!postId){
        for (var i = 0; i < listOfArticle.length; i++){
            const file = fs.readFileSync(__dirname + "/public/article/" + listOfArticle[i], "utf8");

            textFile.push(file);
        }
    } else {
        const file = fs.readFileSync(__dirname + "/public/article/" + postId, "utf8");
        textFile.push(file);
        listOfArticle = [postId];
        
    }

   
    var data = {
        fileNames: listOfArticle,
        textFile: textFile, 
    }


    return data;
}

function processUser(fName, lName, email, pass){
    const formatText= fName + "/n " + lName + "/n " + email + "/n " + pass;

    fs.writeFile(__dirname + "/public/users/"+ email , formatText, (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
}

function searchUser(email, type, pass=""){
    const listOfUser = fs.readdirSync(__dirname + "/public/users/");
    var dataUser = false;
    var count = listOfUser.length;

    for (var i = 0; i < count; i++){

        if (listOfUser[i] === email){
            const file = fs.readFileSync(__dirname + "/public/users/" + listOfUser[i], "utf8");
            const dataFile = file.split("/n ")
            
            if(type === "signup" && dataFile[2] === email){
                dataUser = true;
            } 

            if (type === "login" && dataFile[2] === email && dataFile[3] === pass){
                dataUser = true;

            } 
        }             
    }

    return dataUser

}

app.get("/", (req, res) => {
    const articles = searchFile();
    const authority = req.query.authority

    res.render("index.ejs", articles);

  });

app.get("/post", (req, res) => {
    var articles = searchFile();
    
    const process = req.query.code;
    const postId = req.query.postId;

    if (process === "edit" && postId){
        const file = searchFile(postId);
        res.locals.process = "edit";
        res.render("post.ejs", file)

    } else if (process === "view"){
        if(postId){
            res.locals.process = "view-one";
            var file = searchFile(postId);
            articles["post"] = file['textFile']
            console.log(res.locals.file)
            res.render("index.ejs", articles)
        } else {
            res.locals.process = "view-all"
            
            res.render("post.ejs", articles)
        }

    } else if (process === "delete" && postId){

        fs.unlink(__dirname + "/public/article/"+ postId, (err) => {
            if (err) throw err;
            console.log('The file has been delete!');
        });
        res.redirect("/post?code=view");
    } else if (process === "input"){
        res.locals.process = "input";
        res.render("post.ejs")
    }
  });

app.post("/post/process", (req, res) => {
    const process = req.query.code;
    var postId = req.body['postId'];
    res.locals.process = "view-one";
    if (process === "input"){
        processPost(req.body['title'], req.body['description'], process);
        const length = searchFile()['fileNames'].length - 1;
        const file = searchFile()['fileNames'][length];
        postId = file;
    } else if(process === "edit"){
        processPost(req.body['title'], req.body['description'], process, postId);
    }
    const param = "/post?postId="+postId+"&code=view"
    res.redirect(param);
  });

app.get("/about", (req, res) => {
    res.render("about.ejs");
  });

app.get("/contact", (req, res) => {
    res.render("contact.ejs");
  });

app.get("/account", (req, res) => {
    const process = req.query.type;
    res.locals.type = process;

    res.render("account.ejs");
  });

app.post("/account/process", (req, res) => {
    const process = req.query.type;

    if (process === "login"){
        const check = searchUser(req.body['email'], "login", req.body['password']);

        if(req.body['email'] === "zeki.maulana.rahman@gmail.com"){
            var authority = "admin"
        } else {
            var authority = "user"
        }
        
        if(check){
            res.redirect("/?authority="+authority);
        } else {
            res.redirect("/account?type=login");
        }
    } else if(process === "signup"){
        const check = searchUser(req.body['email'], "signup");

        if(check){
            res.redirect("/account?type=signup");
        } else {
            processUser(req.body['fName'], req.body['lName'], req.body['email'], req.body['password']);
            res.redirect("/account?type=login");  
        }      
    }

  });

  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });