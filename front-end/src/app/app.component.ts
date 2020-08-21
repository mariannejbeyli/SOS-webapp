import { Component, ViewChild, ElementRef } from "@angular/core";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  @ViewChild("fileDropRef", { static: false }) fileDropEl: ElementRef;
  @ViewChild("xmlDropRef", { static: false }) xmlDropEl: ElementRef;
  files: any[] = [];
  fileName : string;
  xml: any[] = [];
  xmlName : string;
  server_files :string[] = [];
  select = false;
  upload = false;
  dropdownValue = "";
  sos = "";

  ngOnInit(){
    document.getElementById("xmlDropdown").hidden=true;
    document.getElementById("xml").hidden=true;
    fetch("http://localhost:3000/xml").then(response => response.json()).then(data => this.server_files = data.data);
  }

  /**
   * on file drop handler
   */
  onFileDropped($event,ftype) {
    this.prepareFilesList($event,ftype);
    
  }

  /**
   * handle file from browsing
   */
  fileBrowseHandler(files,ftype) {
    
    this.prepareFilesList(files,ftype);
  }

  /**
   * Delete file from files list
   * @param index (File index)
   */
  deleteFile(ftype:string) {
    if (ftype==="csv"){
      if (this.files[0].progress < 100) {
        console.log("Upload in progress.");
        return;
      }
      this.files.splice(0, this.files.length);
      document.getElementById("responseCsv").innerHTML = "";
    }
    else {
      if (this.xml[0].progress < 100) {
        console.log("Upload in progress.");
        return;
      }
      this.xml.splice(0, this.xml.length);
      document.getElementById("responseXmlUpload").innerHTML = "";
    }
    
  }

  /**
   * Simulate the upload process
   */
  uploadFilesSimulator(ftype) {
    if (ftype==="csv"){
    setTimeout(() => {
      if (this.files.length === 0) {
        return;
      } else {
        const progressInterval = setInterval(() => {
          if (this.files[0].progress === 100) {
            clearInterval(progressInterval);
          } else {
            this.files[0].progress += 5;
          }
        }, 50);
      }
    }, 100);}
    else{
      setTimeout(() => {
        if (this.xml.length === 0) {
          return;
        } else {
          const progressInterval = setInterval(() => {
            if (this.xml[0].progress === 100) {
              clearInterval(progressInterval);
            } else {
              this.xml[0].progress += 5;
            }
          }, 50);
        }
      }, 100);
    }
  }

  /**
   * Convert Files list to normal array list
   * @param files (Files List)
   */
  prepareFilesList(files: Array<any>,ftype:string) {
    if (ftype === "csv"){
      files[0].progress = 0;
      this.fileName = files[0].name;
      this.files.push(files[0]);
  
        
      this.fileDropEl.nativeElement.value = "";
      this.uploadFilesSimulator(ftype);
  
    }
    else{
      files[0].progress = 0;
      this.xmlName = files[0].name;
      this.xml.push(files[0]);

        
      this.xmlDropEl.nativeElement.value = "";
      this.uploadFilesSimulator(ftype);

    }
    
  
  }

  /**
   * format bytes
   * @param bytes (File size in bytes)
   * @param decimals (Decimals point)
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) {
      return "0 Bytes";
    }
    const k = 1024;
    const dm = decimals <= 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  async postData(address:string, name:string, obj:any, labelId:string){
    var formData: FormData = new FormData();
     formData.append(name,obj);
    let response = await fetch(address,{
        method: 'POST',
        body: formData,
        
      })
      let result = await response.json();
      document.getElementById(labelId).innerHTML = result.message;

  }

  async setSOS(){
    this.sos = (<HTMLInputElement>document.getElementById("sos")).value;
     
  }

  setDropdownValue(value){
    this.dropdownValue = value;
  }

  async selectXml(value){
    this.xmlName = value;
  }

  setXml(value){
    if (value === "select"){
      this.select = true;
      this.upload = false;
      document.getElementById("xmlDropdown").hidden = false;
      if (!document.getElementById("xml").hidden){ document.getElementById("xml").hidden=true;}
    }
    else if (value === "upload"){
      this.upload = true;
      this.select = false;
      document.getElementById("xml").hidden = false;
      if (!document.getElementById("xmlDropdown").hidden){ document.getElementById("xmlDropdown").hidden=true;}
    }
  }

  getResult(){
    let response = fetch("http://localhost:3000/result").then(result => result.json().then(data => alert(data.message)));

  }

  async uploadData(){
    this.setSOS();
    if (this.select){
      this.selectXml(this.dropdownValue);
    }
    this.postDataTest();
   
  }

affectLabels(result:any){

  document.getElementById("responseSos").innerHTML = result.message["sos"];
  document.getElementById("responseCsv").innerHTML = result.message["csv"];
  if(this.select){
    document.getElementById("responseXmlSelect").innerHTML = result.message["xml"];
  }
  else if (this.upload){
    document.getElementById("responseXmlUpload").innerHTML = result.message["xml"];
  }
}


postDataTest(){
  if (this.xmlName != "" && this.fileName != "" && this.sos != ""){
    var formData: FormData = new FormData();
    var response:any;
    formData.append("csv",this.files[0]);
    formData.append("sos",this.sos);
    if (this.select){
      formData.append("xmlSelect",this.xmlName);
      response = fetch("http://localhost:3000/select",{
       method: 'POST',
       body: formData
     }).then(response => response.json().then(result => this.affectLabels(result)))
    }
    else{
      formData.append("xmlUpload",this.xml[0]);
      fetch("http://localhost:3000/upload",{
       method: 'POST',
       body: formData
     }).then(response => response.json().then(result => this.affectLabels(result)))
    }

    this.getResult();
    
  }
  else {
    alert("You have not entered all required data");
  }

  }

}
