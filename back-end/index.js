const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');
var fs = require("fs"),
    parseString = require("xml2js").parseString,
    xml2js = require("xml2js");
const app = express();
fileXml = '';

// enable files upload
app.use(fileUpload({
    createParentPath: true
}));

//add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

//start app 
const port =  3000;
result = "Import unsuccessful";

function execute(xmlF,res){
    const {spawn} = require("child_process");
    const sosc = spawn("java",["-jar","./52n-sos-importer-feeder-0.4.2-bin.jar","-c","./xml/"+xmlF]);
    const grep = spawn("grep", ["New observations in SOS"]);
    sosc.stdout.pipe(grep.stdin);

    grep.stdout.on("data", data => {
        result = data.toString();
        console.log(result)
    });
        
    grep.stderr.on("data", data => {
        result = "Unsuccesful import";
        console.log(`stderr: ${data}`);
    });
        
    grep.on('error', (error) => {
        result = "Unsuccesful import";
        console.log(`error: ${error.message}`);
    });
        
    grep.on("close", code => {
        console.log(`child process exited with code ${code}`);
        res.send({message:result});
    });
}

function configXML(csvF, xmlF, sos){
    fs.readFile("./xml/"+xmlF, "utf-8", function(err, data) {
    if (err) console.log(err);
    parseString(data, function(err, result) {
        if (err) console.log(err);
        
        var json = result;
        json.SosImportConfiguration.SosMetadata[0].URL = sos;
        json.SosImportConfiguration.DataFile[0].LocalFile[0].Path =  __dirname + "/csv/"+csvF;


        var builder = new xml2js.Builder();
        var xml = builder.buildObject(json);

        fs.writeFile("./xml/"+xmlF, xml, function(err, data) {
        if (err) console.log(err);

        console.log("Successfully written our updated xml to file\n" + xmlF +"\n"+csvF + "\n" + sos);
        
        });
    });
    });

}

app.get('/xml', (req, res) => {
    const path = require('path');
    const fs = require('fs');
    const directoryPath = path.join(__dirname, 'xml');
    fs.readdir(directoryPath, function (err, files) {
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
    res.send({data: files});
        });
});

app.get('/result',(req,res)=> {
    execute(fileXml,res);
    //res.send({message : result});

})


app.post('/upload', async (req, res) => {
    try {
        console.log(req.body);
        console.log(req.files);
        if(!req.body || !req.files) {
            res.send({
                status: false,
                message: 'POST failed'
            });
        } else {
            let sosInstance = req.body.sos;
            let xmlFile = req.files.xmlUpload;
            let csvFile = req.files.csv;
            fileXml = xmlFile.name;
            xmlFile.mv('./xml/' + xmlFile.name);
            csvFile.mv('./csv/' + csvFile.name);

            
            res.send({
                status: true,
                message: {sos:'SOS instance: ' + sosInstance, csv:"File uploaded: "+csvFile.name, xml:"File uploaded: "+xmlFile.name},
                
            });
            configXML(csvFile.name, xmlFile.name, sosInstance);
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/select', async (req, res) => {
    try {
        console.log(req.body);
        console.log(req.files || !req.files);
        if(!req.body) {
            res.send({
                status: false,
                message: 'POST failed'
            });
        } else {
            sosInstance = req.body.sos;
            xmlFile = req.body.xmlSelect;
            csvFile = req.files.csv;
            fileXml = xmlFile;
            csvFile.mv('./csv/' + csvFile.name);
            configXML(csvFile.name, xmlFile, sosInstance);
            //send response
            res.send({
                status: true,
                message: {sos:'SOS instance: ' + sosInstance, csv:"File uploaded: "+csvFile.name, xml:"File selected: "+xmlFile},
                
            });
            
        }
    } catch (err) {
        res.status(500).send(err);
    }

    
});

app.listen(port, () => 
  console.log(`App is listening on port ${port}.`)
);






