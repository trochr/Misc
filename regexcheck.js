/* Solution checker for https://regexcrossword.com/ puzzles */
 
function UIcleanUp() { // Remove disctracting stuff
    try {
        document.querySelector("body > div.view.ng-scope > div > div.alert.ng-isolate-scope.alert-danger").remove()
        document.querySelector("body > merch").remove()
        document.querySelector("body > div.navbar.navbar-inverse.navbar-fixed-top").remove()
 
        delete window.Puzzle
    }
    catch {   
    }
}
 
Puzzle = class  {
    constructor(d) {
        // Getting the dimension of the crossword :
        // rows: number of div/2 and cols:number of th/2
        this.dim = [d.querySelectorAll("th.clue").length/2,
                             d.querySelectorAll("div.clue").length/2]
        this.rows = []
        this.rowA = []
        this.cols = []
        this.colA = []
        this.doc = d
 
        // looking for all the "clue" class elements
        // iterate around the columns
        var cluesV=d.querySelectorAll("div.clue")
        var that = this
        cluesV.forEach(function(e,i,n){
          var cols=that.dim[1]
          if (that.cols[i%cols] == undefined) {
              that.cols[i%cols] = []
          }
          that.cols[i%cols].push(e.querySelector("span").innerText)
        })
 
        // iterate around the rows
        var cluesH=d.querySelectorAll("th.clue")
        cluesH.forEach(function(e,i,n){
          if (that.rows[Math.floor(i/2)] == undefined) {
              that.rows[Math.floor(i/2)] = []
          }
          that.rows[Math.floor(i/2)].push(e.querySelector("span").innerText)
 
        })
    }
 
    loadAnswers(){
        var that = this
        this.answers = []
        var chars = this.doc.querySelectorAll('input.char')
        chars.forEach(function(e,i,n){
            that.answers[i] = e.value
            if (that.rowA[Math.floor(i/p.dim[1])] == undefined) {
              that.rowA[Math.floor(i/p.dim[1])] = []
            }
            that.rowA[Math.floor(i/p.dim[1])].push(e.value)
        })
        for (var j = 0; j < p.dim[1]; j++) {
          for (var i = 0; i < this.rowA.length; i++) {
            if (this.colA[j] == undefined) {
              this.colA[j] = []
 
            }
            this.colA[j].push(this.rowA[i][j])
          }      
        }
    }
 
    checkAnswers(){
        // need to check each answers against the regexes:
        // checking horizontal answers:
        for (var i=0; i < this.dim[0]; i++) {
            this.checkRegex(this.rowA[i].join(""),this.rows[i][0],"row",i)
            // Fixme :in early puzzles, there are no regex on the right
            this.checkRegex(this.rowA[i].join(""),this.rows[i][1],"row",i)  
        }
 
        // checking vertical answers:
        for (var i=0; i < this.dim[1]; i++) {
            this.checkRegex(this.colA[i].join(""),this.cols[i][0],"col",i)
            // Fixme :in early puzzles, there are no regex on the right
            this.checkRegex(this.colA[i].join(""),this.cols[i][1],"col",i)  
        }
    }
 
    checkRegex(s,r,t,i){
        if (r == ""){
            return
        }
        var re = new RegExp(r)
        var res = re.exec(s)
        if (res == null || res[0].length != s.length){
//            console.log("Mismatch "+t+i," : "+s,"/",r)
            this.highlightCells(t,i)
        }
    }
 
    highlightCells(type,cellIndex){
        var chars=this.doc.querySelectorAll("input.char")
        var that = this
        chars.forEach(function(e,i,n){
            if ((type == "row" && cellIndex == Math.floor(i/that.dim[1]))
                || (type == "col" && cellIndex == i%that.dim[1])){
                if (e.value != " "){
                    e.style.background = "rgb(255, 136, 136)"  
                }
            }
        })
 
    }
}
 
var chars=document.querySelectorAll("input.char")
chars.forEach(function(e,i,n){
    if (e.style.background == "rgb(255, 136, 136)"){
        e.style.background = "rgb(255, 255, 255)"
    }
})
 
var p = new Puzzle(document)
 
// UIcleanUp()
p.loadAnswers()
p.checkAnswers()
