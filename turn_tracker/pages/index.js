import Head from 'next/head'
import Image from 'next/image'
import { Inter, Waiting_for_the_Sunrise } from '@next/font/google'
import styles from '@/styles/Home.module.css'

import { v4 as uuidv4 } from 'uuid';
import { useState, useEffect, setState } from 'react';

const inter = Inter({ subsets: ['latin'] })

function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match

  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    // only execute all the code below in client side
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Add event listener
    window.addEventListener("resize", handleResize);
     
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount
  return windowSize;
}

class Scenario {
  
  constructor(rows = [[{'title': 'Title', 'text': '', 'cols': 5}]]) {
    this.rows = rows;
    
    this.totCols = 0;

    // if using a preset or loaded scenario, load total columns
    for (var i = 0; i < this.rows.length; i++) { 
      for (var j = 0; j < this.rows[i].length; j++) {
        this.rows[i][j].cols = this.rows[i][j].title.length + 2;
        this.totCols += this.rows[i][j].cols;
      }
    }
  }

  // Map the scenario and its data onto the page
  generate() { 
    
    // State of rows and cell objects
    const [rows, setRows] = useState(this.rows) 
    // State of window size
    const size = useWindowSize(); 
    // Pixels to Points conversion (16 pixels to 12 points). TODO: Automatically set ptp.
    const ptp = 21; 

    // Gets total columns of a single row
    function getTotalCols(row) { 
      var total = 0;
      for (var i = 0; i < rows[row].length; i++) {
        total += rows[row][i].cols
      }
      return total;
    }

    // Duplicates a row and adds it beneath
    function handleDupRow() { 

      // Create a low level copy of rows to avoid reference
      var tempRows = []
      for (var i = 0; i < rows.length; i++) {
        tempRows.push([]);
        for(var j = 0; j < rows[i].length; j++) {
          tempRows[i].push({'title' : "", 'text' : "", "cols" : undefined});
          tempRows[i][j].title = rows[i][j].title;
          tempRows[i][j].text = rows[i][j].text;
          tempRows[i][j].cols = rows[i][j].cols;
        }
      }

      // Create a low level copy of a row from the other copy to again avoid any references. Fuck this language.
      var tempRow = []
      for (var i = 0; i < tempRows[tempRows.length-1].length; i++) {
        tempRow.push({'title' : "", 'text' : "", "cols" : undefined});
        tempRow[i].title = tempRows[tempRows.length-1][i].title;
        tempRow[i].text = tempRows[tempRows.length-1][i].text;
        tempRow[i].cols = tempRows[tempRows.length-1][i].cols;
      }

      tempRows.push(tempRow);
      setRows(tempRows)
    }

    // Adds a new basic row
    function handleNewRow() { 

      var tempRows = []
      for (var i = 0; i < rows.length; i++) {
        tempRows.push([]);
        for(var j = 0; j < rows[i].length; j++) {
          tempRows[i].push(rows[i][j]);
        }
      }

      tempRows = tempRows.concat([[{'title': 'Title', 'text': '', 'cols': 5}]])
      setRows(tempRows)
    }


    // Map the ith row onto the page
    function generateRows(i) { 

      // Adds a new basic cell
      function handleNewCell() { 

        var tempRows = []
        for (var i2 = 0; i2 < rows.length; i2++) {
          tempRows.push([]);
          for(var j = 0; j < rows[i2].length; j++) {
            tempRows[i2].push(rows[i2][j]);
          }
        }
        
        tempRows[i].push({'title': 'Title', 'text': '', 'cols': 5})
        setRows(tempRows);
      }

      return (
        <div className={styles.row} key={"row"+String(i)} id={"row"+String(i)}>
          {
            rows[i].map( (cell, j)=>(
              console.log("generating cell..."),
              generateCell(i, j)
            ))
          }
          <button className={styles.new_btn} key={i} onClick={handleNewCell} key={"row"+String(i)+"-new-cell-btn"} id={"row"+String(i)+"-new-cell-btn"}>+</button>
        </div>
      )
    }

    
    // Maps the jth cell of the ith row onto the page
    function generateCell(i, j) { 

      // Change size of the textarea up to a max size based on the window
      function handleChange(event) { 
         
        const max_size = Math.round(size.width/ptp);
        const total_size = getTotalCols(i);
        const space = max_size - total_size;

        var tempRows = []
        for (var i2 = 0; i2 < rows.length; i2++) {
          tempRows.push([]);
          for(var j2 = 0; j2 < rows[i2].length; j2++) {
            tempRows[i2].push(rows[i2][j2]);
          }
        }

        // Text or Title
        if (event.target.id == "row"+String(i)+"-cell"+String(j)+"-title" ) 
        { tempRows[i][j].title = event.target.value } 
        else 
        { tempRows[i][j].text = event.target.value }

        const new_cols = Math.max(tempRows[i][j].title.length + 2, tempRows[i][j].text.length + 2);
        const diff = new_cols - rows[i][j].cols
        // Fill available space if too big
        event.target.cols = new_cols;
        if (space - diff < 0) { event.target.cols += space - diff }

        tempRows[i][j].cols = event.target.cols;

        setRows(tempRows);
        
      }

      return (
       <div className={styles.cell} key={"row"+String(i)+"-cell"+String(j)} id={"row"+String(i)+"-cell"+String(j)}>
        <textarea className={styles.text} key={"row"+String(i)+"-cell"+String(j)+"-title"} id={"row"+String(i)+"-cell"+String(j)+"-title"} onChange={handleChange} type="text" defaultValue={rows[i][j].title} placeholder="Title" cols={rows[i][j].cols}/>
        <textarea className={styles.text} key={"row"+String(i)+"-cell"+String(j)+"-text"} id={"row"+String(i)+"-cell"+String(j)+"-text"} onChange={handleChange} type="text" defaultValue={rows[i][j].text} cols={rows[i][j].cols}/>
       </div>,
       
      )
    }

    return (
      <div className={styles.scenario} id="scenario" key="scenario">
        {
          rows.map( (row, i)=>(
            generateRows(i)
          ))
        }
        <button className={styles.new_btn} id="new-row-btn" key="new-row-btn" onClick={handleNewRow}>+</button>
        <button className={styles.new_btn} id="dup-row-btn" key="dup-row-btn" onClick={handleDupRow}>v</button>
      </div>
    )
  }

}
    

// Generate empty scenario
function generate_scenario() {
  var scn = new Scenario();
  return scn.generate();
}

// Generate a scenario for a general D&D 5e game
function generate_5e_scenario() {

  var initCell = {'title' : "Iniative", 'text' : "", 'cols' : 5}
  var nameCell = {'title' : "Name", 'text' : "", 'cols' : 5}
  var acCell = {'title' : "AC", 'text' : "", 'cols' : 5}
  var hpCell = {'title' : "HP", 'text' : "", 'cols' : 5}
  var notesCell = {'title' : "Notes", 'text' : "", 'cols' : 5}
  var row = [initCell, nameCell, hpCell, acCell, notesCell]
  var scn = new Scenario([row])

  return scn.generate();
}

export default function Home() {
  return (
    <>
      <Head>
        <title>Turn Tracker</title>
        <meta name="description" content="A Web App for trackering TTRPG turn-based scenarios"></meta>
        <link rel="icon" href="/favicon.ico"/>
      </Head>
      <main className={styles.main}>
        <select>
          <option>Basic</option>
          <option>D&D 5e</option>
          <option>Pathfinder 2e</option>
        </select>
        {
          generate_5e_scenario() // TODO: Change this setting depending on selection or loading from cookie
        }
      </main>
    </>
  )
}
