import Head from 'next/head'
import Image from 'next/image'
import { Inter, Waiting_for_the_Sunrise } from '@next/font/google'
import styles from '@/styles/Home.module.css'
import * as cookie from 'cookie'
import { getClient } from '../lib/mongodb'
import { ObjectId } from 'mongodb'

import { useState, useEffect, setState } from 'react'
import { setCookie, getCookie, hasCookie } from 'cookies-next'

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
  
  constructor(rows = [[{'title': 'Title', 'text': '', 'cols': 5, 'display': 'none'}]]) {
    this.rows = rows;

    for (var i = 0; i < this.rows.length; i++) { 
      for (var j = 0; j < this.rows[i].length; j++) {
        this.rows[i][j].cols = this.rows[i][j].title.length + 1;
      }
    }
  }

  // Map the scenario and its data onto the page
  generate() { 
    
    // State of rows and cell objects
    const [rows, setRows] = useState(this.rows); 
    // State of whether the scenario is being run or not
    const [running, setRunning] = useState(false);
    // State of the currently active row
    const [activeRow, setActiveRow] = useState(0)
    // State of the current round of the turn-based scenario
    const [round, setRound] = useState(1);
    // State of window size
    const size = useWindowSize(); 
    // State of whether the scenario has been edited since the first load
    const [edited, setEdited] = useState(false);
    // State of the new scenario menu display
    const [scenarioMenu, setScenarioMenu] = useState("none")
    const [scenarioBtn, setScenarioBtn] = useState("block")
    // State of preset scenario chosen
    const [preset, setPreset] = useState("D&D")
    // Time between saving the scenario
    const AUTOSAVE_COOLDOWN = 5000;

    // Uses a timer to automatically save the scenario
    useEffect(() => {
      const interval = setInterval( () => {
        if (edited && hasCookie('scenarioId')) {
          saveScenario(rows);
        }
      }, AUTOSAVE_COOLDOWN);
      return () => clearInterval(interval);
    }, [edited, rows]);


    // Pixels to Points conversion (16 pixels to 12 points). TODO: Automatically set ptp.
    const ptp = 21; 
    // Max width of a cell in character widths
    const MAX_COLS = 30;

    function firstEditSave(r) {
      if (!edited) {
        if (hasCookie('scenarioId')) {
          saveScenario(r)
        } else {
          createScenario(r)
        }
        setEdited(true);
      }
    }

    // Gets total columns of a single row
    function getTotalCols(row) { 
      var total = 0;
      for (var i = 0; i < rows[row].length; i++) {
        total += rows[row][i].cols
      }
      return total;
    }

    function handleStart() {
      setRunning(!running);
      setActiveRow(0);
      setRound(1);
    }

    function handleNext() {
      if (running) {
        if (activeRow == rows.length-1) {
          setRound(round + 1);
          setActiveRow(0);
        }
        else {
          setActiveRow(activeRow + 1);
        }
      }
    }

    function handleNewScenario() {
      setScenarioMenu("flex")
      setScenarioBtn("none")
    }

    function handleNewEmptyScenario() {
      if (hasCookie('scenarioId')) {
        deleteScenario(getCookie('scenarioId').toString())
      }

      var titleCell = {'title' : "Title", 'text' : "", 'cols' : 5, 'display' : 'none'}
      var row = [titleCell]

      setEdited(false);
      setRound(1);
      setActiveRow(0);
      setRunning(false);
      setScenarioMenu("none")
      setScenarioBtn("block")
      setRows([row])
    }

    function handleNewPresetScenario() {
      if (hasCookie('scenarioId')) {
        deleteScenario(getCookie('scenarioId').toString())
      }

      let row = [];
      switch (preset) {
        case "D&D":
          const initCell = {'title' : "Initiative", 'text' : "", 'cols' : 5, 'display' : 'none'}
          const nameCell = {'title' : "Name", 'text' : "", 'cols' : 5, 'display' : 'none'}
          const acCell = {'title' : "AC", 'text' : "", 'cols' : 5, 'display' : 'none'}
          const hpCell = {'title' : "HP", 'text' : "", 'cols' : 5, 'display' : 'none'}
          const notesCell = {'title' : "Notes", 'text' : "", 'cols' : 5, 'display' : 'none'}
          row = [initCell, nameCell, hpCell, acCell, notesCell]
          break;
        default:
          var titleCell = {'title' : "Title", 'text' : "", 'cols' : 5, 'display' : 'none'}
          row = [titleCell]
      }


      setEdited(false);
      setRound(1);
      setActiveRow(0);
      setRunning(false);
      setScenarioMenu("none")
      setScenarioBtn("block")
      setRows([row])
    }

    function handlePresetSelect(event) {
      setPreset(event.target.value)
    }

    function generateStartButtonText() {
      return running ? "Reset" : "Start";
    }

    // Duplicates a row and adds it beneath
    function handleDupRow() { 
      if (rows.length == 0) {return;}
      // Create a low level copy of rows to avoid reference
      var tempRows = []
      for (var i = 0; i < rows.length; i++) {
        tempRows.push([]);
        for(var j = 0; j < rows[i].length; j++) {
          tempRows[i].push({'title' : rows[i][j].title, 'text' : rows[i][j].text, 'cols' : rows[i][j].cols, 'display' : rows[i][j].display})
        }
      }

      // Create a low level copy of a row from the other copy to again avoid any references. Fuck this language.
      var tempRow = []
      for (var i = 0; i < tempRows[tempRows.length-1].length; i++) {
        tempRow.push({'title' : "", 'text' : "", "cols" : undefined, 'display' : 'none'});
        tempRow[i].title = tempRows[tempRows.length-1][i].title;
        tempRow[i].text = tempRows[tempRows.length-1][i].text;
        tempRow[i].cols = tempRows[tempRows.length-1][i].cols;
        tempRow[i].display = tempRows[tempRows.length-1][i].display;
      }

      tempRows.push(tempRow);
      firstEditSave(tempRows);
      setRows(tempRows)
    }

    // Adds a new basic row
    function handleNewRow() { 

      var tempRows = []
      for (var i = 0; i < rows.length; i++) {
        tempRows.push([]);
        for(var j = 0; j < rows[i].length; j++) {
          tempRows[i].push({'title' : rows[i][j].title, 'text' : rows[i][j].text, 'cols' : rows[i][j].cols, 'display' : rows[i][j].display})
        }
      }

      tempRows = tempRows.concat([[{'title': 'Title', 'text': '', 'cols': 5, 'display' : 'none'}]])

      firstEditSave(tempRows);

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
            tempRows[i2].push({'title' : rows[i2][j].title, 'text' : rows[i2][j].text, 'cols' : rows[i2][j].cols, 'display': rows[i2][j].display})
          }
        }
        
        tempRows[i].push({'title': 'Title', 'text': '', 'cols': 5, 'display' : "none"})

        firstEditSave(tempRows);

        setRows(tempRows);
      }

      // reconstructs rows as if the target and the row above are swapped
      function handleMoveRowUp() {
        if (i != 0) {
          var tempRows = []
          for (var i2 = 0; i2 < rows.length; i2++) {
            tempRows.push([]);
            // reached target index
            if (i2 == i) { 
              const len1 = rows[i2].length;
              const len2 = rows[i2-1].length;
              // smaller row above
              if (len1 > len2) { 
                for (var j = 0; j < len1; j++) {
                  // reached limit of row above the target
                  if (j > len2-1) { 
                    var tempCell = {'title' : rows[i2][j].title, 'text' : rows[i2][j].text, 'cols' : rows[i2][j].cols, 'display' : rows[i2][j].display}
                    tempRows[i2-1].push({'title' : tempCell.title, 'text' : tempCell.text, 'cols' : tempCell.cols, 'display' : tempCell.display})
                  } else {
                    tempRows[i2].push({'title' : "Title", 'text' : "", "cols" : undefined, 'display' : "none"});
                    var tempCell = {'title' : rows[i2][j].title, 'text' : rows[i2][j].text, 'cols' : rows[i2][j].cols, 'display' : rows[i2][j].display}
                    tempRows[i2][j] = {'title' : rows[i2-1][j].title, 'text' : rows[i2-1][j].text, 'cols' : rows[i2-1][j].cols, 'display' : rows[i2-1][j].display}
                    tempRows[i2-1][j] = {'title' : tempCell.title, 'text' : tempCell.text, 'cols' : tempCell.cols, 'display' : tempCell.display}
                  }
                }
              // same row length above
              } else if (len1 == len2) { 
                for (var j = 0; j < len1; j++) {
                  tempRows[i2].push({'title' : "Title", 'text' : "", "cols" : undefined, 'display' : "none"});
                  var tempCell = {'title' : rows[i2][j].title, 'text' : rows[i2][j].text, 'cols' : rows[i2][j].cols, 'display' : rows[i2][j].display}
                  tempRows[i2][j] = {'title' : rows[i2-1][j].title, 'text' : rows[i2-1][j].text, 'cols' : rows[i2-1][j].cols, 'display' : rows[i2-1][j].display}
                  tempRows[i2-1][j] = {'title' : tempCell.title, 'text' : tempCell.text, 'cols' : tempCell.cols, 'display' : tempCell.display}
                }
              // longer row above
              } else { 
                for (var j = 0; j < len2; j++) {
                  // reached limit of target
                  if (j > len1-1) { 
                    tempRows[i2].push( {'title' : rows[i2-1][j].title, 'text' : rows[i2-1][j].text, 'cols' : rows[i2-1][j].cols, 'display' : rows[i2-1][j].display })
                  } else {
                    var tempCell = {'title' : rows[i2][j].title, 'text' : rows[i2][j].text, 'cols' : rows[i2][j].cols, 'display' : rows[i2][j].display}
                    tempRows[i2].push ({'title' : rows[i2-1][j].title, 'text' : rows[i2-1][j].text, 'cols' : rows[i2-1][j].cols, 'display' : rows[i2-1][j].display})
                    tempRows[i2-1][j] = {'title' : tempCell.title, 'text' : tempCell.text, 'cols' : tempCell.cols, 'display' : tempCell.display}
                  }
                }
                // remove extra space on row above
                for (var k = 0; k < len2-len1; k++) { 
                  tempRows[i2-1].pop();
                } 
              }
              
            } else {
              for(var j = 0; j < rows[i2].length; j++) {
                tempRows[i2].push({'title' : rows[i2][j].title, 'text' : rows[i2][j].text, 'cols' : rows[i2][j].cols, 'display' : rows[i2][j].display})
              }
            }
            
          }
          if (running && activeRow == i) { setActiveRow(activeRow - 1); }

          firstEditSave(tempRows);

          setRows(tempRows)
        } else {
          setRows(rows)
        }
      }

      // reconstructs rows as if the target and the row below are swapped
      function handleMoveRowDown() {
        if (i != rows.length-1) {
          var tempRows = []
          for (var i2 = 0; i2 < rows.length; i2++) {
            tempRows.push([])
            if (i2 == i) {
              tempRows.push([])
              const len1 = rows[i2].length;
              const len2 = rows[i2+1].length;
              if (len1 > len2) {
                // smaller row below
                for (var j = 0; j < len1; j++) {
                  // reached limit of row below
                  if (j > len2-1) { 
                    tempRows[i2+1].push( {'title' : rows[i2][j].title, 'text' : rows[i2][j].text, 'cols' : rows[i2][j].cols, 'display' : rows[i2][j].display} )
                  } else {
                    tempRows[i2+1].push ({'title' : rows[i2][j].title, 'text' : rows[i2][j].text, 'cols' : rows[i2][j].cols, 'display' : rows[i2][j].display})
                    tempRows[i2].push ({'title' : rows[i2+1][j].title, 'text' : rows[i2+1][j].text, 'cols' : rows[i2+1][j].cols, 'display' : rows[i2+1][j].display})
                  }
                } 
              } else if (len1 == len2) {
                // same length below
                for (var j = 0; j < len1; j++) {
                  tempRows[i2+1].push ({'title' : rows[i2][j].title, 'text' : rows[i2][j].text, 'cols' : rows[i2][j].cols, 'display' : rows[i2][j].display})
                  tempRows[i2].push ({'title' : rows[i2+1][j].title, 'text' : rows[i2+1][j].text, 'cols' : rows[i2+1][j].cols, 'display' : rows[i2+1][j].display})
                }
              } else {
                // longer row below
                for (var j = 0; j < len2; j++) {
                  // reached limit of target
                  if (j > len1-1) {
                    tempRows[i2].push( {'title' : rows[i2+1][j].title, 'text' : rows[i2+1][j].text, 'cols' : rows[i2+1][j].cols, 'display' : rows[i2+1][j].display} )
                  } else {
                    tempRows[i2+1].push ({'title' : rows[i2][j].title, 'text' : rows[i2][j].text, 'cols' : rows[i2][j].cols, 'display' : rows[i2][j].display})
                    tempRows[i2].push ({'title' : rows[i2+1][j].title, 'text' : rows[i2+1][j].text, 'cols' : rows[i2+1][j].cols, 'display' : rows[i2+1][j].display})
                  }
                }
              }
              i2 += 1;
            } else {
              for(var j = 0; j < rows[i2].length; j++) {
                tempRows[i2].push({'title' : rows[i2][j].title, 'text' : rows[i2][j].text, 'cols' : rows[i2][j].cols, 'display' : rows[i2][j].display})
              }
            }
          }
          if (running && activeRow == i) { setActiveRow(activeRow + 1); }

          firstEditSave(tempRows);

          setRows(tempRows)
        } else {
          setRows(rows)
        }

      }

      // reconstructs rows as if the target row never existed
      function handleRemoveRow() { 
        var tempRows = []
        var index = 0;
        for (var i2 = 0; i2 < rows.length; i2++) {
          if (i2 == i) { continue; }
          tempRows.push([])
          for (var j = 0; j < rows[i2].length; j++) {
            tempRows[index].push({'title' : rows[i2][j].title, 'text' : rows[i2][j].text, 'cols' : rows[i2][j].cols, 'display' : rows[i2][j].display})
          }
          index += 1;
        }
        if (running && activeRow == rows.length-1) { setActiveRow(activeRow - 1); }

        firstEditSave(tempRows);

        setRows(tempRows)
      }

      // Generate the row style for when the row is active
      function generateRowStyle() {
        if (running && activeRow == i) {
          return {'rowBorder' : "4px solid #d2752d"};
        } else {
          return {'rowBorder': "none"};
        }
      }

      var rowStyle = generateRowStyle();

      return (
        <div className={styles.row} key={"row"+String(i)} id={"row"+String(i)} >
          <div className={styles.row_btn_container} key={"row"+String(i)+"-row-buttons"} id={"row"+String(i)+"-row-buttons"}>
            <button className={styles.row_btn} key={"row"+String(i)+"-row-up-btn"} id={"row"+String(i)+"-row-up-btn"} onClick={handleMoveRowUp}>^</button>
            <button className={styles.row_btn} key={"row"+String(i)+"-row-delete-btn"} id={"row"+String(i)+"-row-delete-btn"} onClick={handleRemoveRow}>x</button>
            <button className={styles.row_btn} key={"row"+String(i)+"-row-down-btn"} id={"row"+String(i)+"-row-down-btn"} onClick={handleMoveRowDown}>v</button>
          </div>
          <div className={styles.row_cell_container} style = {{border: rowStyle.rowBorder}}>
          {
            rows[i].map( (cell, j)=>(
              generateCell(i, j)
            ))
          }
          </div>
          <div className={styles.new_cell_btn_container} key={"row"+String(i)+"-new-cell-btn-container"} id={"row"+String(i)+"-new-cell-btn-container"}>
              <button className={styles.new_cell_btn} onClick={handleNewCell} key={"row"+String(i)+"-new-cell-btn"} id={"row"+String(i)+"-new-cell-btn"}>+</button>
            </div>
        </div>
      )
    }

    
    // Maps the jth cell of the ith row onto the page
    function generateCell(i, j) { 

      // Change size of the textarea up to a max size based on the window
      function handleChange(event) { 

        var tempRows = []
        for (var i2 = 0; i2 < rows.length; i2++) {
          tempRows.push([]);
          for(var j2 = 0; j2 < rows[i2].length; j2++) {
            if (i2 == i && j2 == j) {
              tempRows[i2].push({'title' : rows[i2][j2].title, 'text' : rows[i2][j2].text, 'cols' : rows[i2][j2].cols, 'display' : "flex"})
            } else {
              tempRows[i2].push({'title' : rows[i2][j2].title, 'text' : rows[i2][j2].text, 'cols' : rows[i2][j2].cols, 'display' : rows[i2][j2].display})
            }
            
          }
        }
        
        // Text or Title
        if (event.target.id == "row"+String(i)+"-cell"+String(j)+"-title" ) 
        { tempRows[i][j].title = event.target.value } 
        else 
        { tempRows[i][j].text = event.target.value }
  
        var new_cols = Math.max(tempRows[i][j].title.length + 2, tempRows[i][j].text.length + 2);
        const diff = new_cols - rows[i][j].cols
        // Fill available space if too big
        if (MAX_COLS - new_cols < 0) { new_cols -= diff; }
      
        event.target.cols = new_cols;
        
        tempRows[i][j].cols = event.target.cols;

        firstEditSave(tempRows);
        
        setRows(tempRows);
        
      }

      // View the cell buttons when the cell is being edited
      function handleCellMouseOver() {
        var tempRows = []
        for (var i2 = 0; i2 < rows.length; i2++) {
          tempRows.push([])
          for (var j2 = 0; j2 < rows[i2].length; j2++) {
            if (i2 == i && j2 == j) {
              tempRows[i2].push({'title' : rows[i2][j2].title, 'text' : rows[i2][j2].text, 'cols' : rows[i2][j2].cols, 'display' : "flex"})
            } else {
              tempRows[i2].push({'title' : rows[i2][j2].title, 'text' : rows[i2][j2].text, 'cols' : rows[i2][j2].cols, 'display' : rows[i2][j2].display})
            }
          }
        }
        setRows(tempRows)
      }

      // Hide the cell button when the cell is not being edited
      function handleCellMouseLeave() {
        var tempRows = []
        for (var i2 = 0; i2 < rows.length; i2++) {
          tempRows.push([])
          for (var j2 = 0; j2 < rows[i2].length; j2++) {
            if (i2 == i && j2 == j) {
              tempRows[i2].push({'title' : rows[i2][j2].title, 'text' : rows[i2][j2].text, 'cols' : rows[i2][j2].cols, 'display' : "none"})
            } else {
              tempRows[i2].push({'title' : rows[i2][j2].title, 'text' : rows[i2][j2].text, 'cols' : rows[i2][j2].cols, 'display' : rows[i2][j2].display})
            }
          }
        }
        setRows(tempRows)
      }

      // reconstructs rows as if the targeted cell was swapped with the one before it
      function handleMoveCellLeft() {
        if (j != 0) {
          var tempRows = []
          for (var i2 = 0; i2 < rows.length; i2++) {
            tempRows.push([])
            for (var j2 = 0; j2 < rows[i2].length; j2++) {
              if (i2 == i && j2 == j) {
                var tempCell = {'title' : rows[i2][j2-1].title, 'text' : rows[i2][j2-1].text, 'cols' : rows[i2][j2-1].cols, 'display' : rows[i2][j2-1].display}
                tempRows[i2][j2-1] = {'title' : rows[i2][j2].title, 'text' : rows[i2][j2].text, 'cols' : rows[i2][j2].cols, 'display' : rows[i2][j2].display}
                tempRows[i2].push({'title' : tempCell.title, 'text' : tempCell.text, 'cols' : tempCell.cols, 'display' : tempCell.display})
              } else {
                tempRows[i2].push({'title' : rows[i2][j2].title, 'text' : rows[i2][j2].text, 'cols' : rows[i2][j2].cols, 'display' : rows[i2][j2].display})
              }
            }
          }

          firstEditSave(tempRows);

          setRows(tempRows)
        } else {
          setRows(rows)
        }
      }

      // reconstructs rows as if the targeted cell was swapped with the one after it
      function handleMoveCellRight() {
        if (j != rows[i].length-1) {
          var tempRows = []
          for (var i2 = 0; i2 < rows.length; i2++) {
            tempRows.push([])
            for (var j2 = 0; j2 < rows[i2].length; j2++) {
              if (i2 == i && j2 == j+1) {
                var tempCell = {'title' : rows[i2][j2-1].title, 'text' : rows[i2][j2-1].text, 'cols' : rows[i2][j2-1].cols, 'display' : rows[i2][j2-1].display}
                tempRows[i2][j2-1] = {'title' : rows[i2][j2].title, 'text' : rows[i2][j2].text, 'cols' : rows[i2][j2].cols, 'display' : rows[i2][j2].display}
                tempRows[i2].push({'title' : tempCell.title, 'text' : tempCell.text, 'cols' : tempCell.cols, 'display' : tempCell.display})
              } else {
                tempRows[i2].push({'title' : rows[i2][j2].title, 'text' : rows[i2][j2].text, 'cols' : rows[i2][j2].cols, 'display' : rows[i2][j2].display})
              }
            }
          }

          firstEditSave(tempRows);

          setRows(tempRows)
        } else {
          setRows(rows)
        }
      }

      // reconstructs rows as if the targeted cell never existed
      function handleRemoveCell() {
        var tempRows = []
        for (var i2 = 0; i2 < rows.length; i2++) {
          tempRows.push([])
          for (var j2 = 0; j2 < rows[i2].length; j2++) {
            if (i2 == i && j2 == j ) { continue; }
            tempRows[i2].push({'title' : rows[i2][j2].title, 'text' : rows[i2][j2].text, 'cols' : rows[i2][j2].cols, 'display' : rows[i2][j2].display})
          }
        }

        firstEditSave(tempRows);

        setRows(tempRows)
      }

      // Generate the cell style for when the row is active
      function generateCellStyle() {
        if (running && activeRow == i) {
          return {'cellFontSize' : "18pt"};
        } else {
          return {'cellFontSize' : "16pt"};
        }
      }

      var cellStyle = generateCellStyle();

      return (
       <div className={styles.cell} key={"row"+String(i)+"-cell"+String(j)} id={"row"+String(i)+"-cell"+String(j)} onFocus={handleCellMouseOver} onMouseLeave={handleCellMouseLeave}>
        <textarea className={styles.title} key={"row"+String(i)+"-cell"+String(j)+"-title"} id={"row"+String(i)+"-cell"+String(j)+"-title"} onChange={handleChange} type="text"  placeholder="Title" cols={rows[i][j].cols} value={rows[i][j].title} style = {{fontSize: cellStyle.cellFontSize}}></textarea>
        <textarea className={styles.text} key={"row"+String(i)+"-cell"+String(j)+"-text"} id={"row"+String(i)+"-cell"+String(j)+"-text"} onChange={handleChange} type="text"  cols={rows[i][j].cols} value={rows[i][j].text} style = {{fontSize: cellStyle.cellFontSize}} ></textarea>
        <div className={styles.cell_btn_container} key={"row"+String(i)+"-cell"+String(j)+"-btn-container"} id={"row"+String(i)+"-cell"+String(j)+"-btn-container"} style = {{ display : rows[i][j].display, flexDirection: "horizontal", justifyContent: "center" }} onMouseOver={handleCellMouseOver} onMouseOut={handleCellMouseLeave} onFocus={handleCellMouseOver}>
          <button className={styles.cell_btn} key={"row"+String(i)+"-cell"+String(j)+"-cell-left-btn"} id={"row"+String(i)+"-cell"+String(j)+"-cell-left-btn"} onClick={handleMoveCellLeft}>{"<"}</button>
          <button className={styles.cell_btn} key={"row"+String(i)+"-cell"+String(j)+"-cell-delete-btn"} id={"row"+String(i)+"-cell"+String(j)+"-cell-delete-btn"} onClick={handleRemoveCell}>{"x"}</button>
          <button className={styles.cell_btn} key={"row"+String(i)+"-cell"+String(j)+"-cell-right-btn"} id={"row"+String(i)+"-cell"+String(j)+"-cell-right-btn"} onClick={handleMoveCellRight}>{">"}</button>
        </div>
       </div>
       
      )
    }

    function generateRoundText() {
      return running ? String(round) : "N/A";
    }

    var roundText = generateRoundText();

    return (
      <div className={styles.scenario} id="scenario" key="scenario">
        <div className={styles.main_menu}>
          <button className={styles.start_btn} onClick={handleStart} > {generateStartButtonText()} </button>
          <button className={styles.next_btn} onClick={handleNext}> {"Next Turn"} </button>
        </div>
        <button className={styles.new_scenario_btn} onClick={handleNewScenario} style = {{ display: scenarioBtn }}>New Scenario</button>
        <div className={styles.new_scenario_menu} style = {{ display: scenarioMenu }}>
          <button className={styles.new_empty_scenario_btn} onClick={handleNewEmptyScenario} >Empty</button>
          <select className={styles.new_preset_slct} onChange={handlePresetSelect}>
            <option>D&D</option>
            <option>Pathfinder</option>
          </select>
          <button className={styles.new_preset_confirm_btn} onClick={handleNewPresetScenario}>{">"}</button>
        </div>
        <h1 className={styles.round}>{"Round: "+roundText}</h1>
          
        {
          rows.map( (row, i)=>(
            generateRows(i)
          ))
        }
        <button className={styles.row_btn} id="new-row-btn" key="new-row-btn" onClick={handleNewRow}>+</button>
        <button className={styles.row_btn} id="dup-row-btn" key="dup-row-btn" onClick={handleDupRow}>v</button>
      </div>
    )
  }

}

async function createScenario(r) {
  var m = 'POST';

  const response = await fetch("/api/scenarios", {
    method: m,
    body: JSON.stringify(r),
    headers: {
      'Content-Type': 'application/json',
    }
  })

  const data = await response.json()
  setCookie("scenarioId", data.id, { sameSite: "lax", maxAge: 691200 })
}
// Save the scenario
async function saveScenario(r) {
  var m = 'PUT';

  let scenarioId = getCookie('scenarioId').toString()
  const response = await fetch("/api/scenarios", {
    method: m,
    body: JSON.stringify({"rows" : r, "id" : scenarioId}),
    headers: {
      'Content-Type': 'application/json',
    }
  })
  const data = await response.json()
}

/*async function loadScenario(scenarioId) {
  var m = 'GET'
  var end = "api/scenarios/"+scenarioId
  var url;

  if (process.env.NODE_ENV === 'production') {
    url = "https://turn-tracker.vercel.app/"+end
  } else {
    url = "http://localhost:3000/"+end
  }
  
  const response = await fetch(url, {
    method: m,
    headers: {
      'Content-Type': 'application/json',
    }
  })
  return response;
  
}*/

async function deleteScenario(scenarioId) {
  var m = 'DELETE'

  const response = await fetch("/api/scenarios", {
    method: m,
    body: JSON.stringify(scenarioId),
    headers: {
      'Content-Type' : 'application/json',
    }
  })
  const data = await response.json()
  setCookie('scenarioId', scenarioId, { maxAge : 0 })
}

// Generate empty scenario
function generate_scenario() {
  var scn = new Scenario();
  return scn.generate();
}

// Generate a scenario for a general D&D 5e game
function generate_5e_scenario(scenario) {
  if (scenario != null) {
    let scn = new Scenario(scenario)
    return scn.generate()
  }
  var initCell = {'title' : "Initiative", 'text' : "", 'cols' : 5, 'display' : 'none'}
  var nameCell = {'title' : "Name", 'text' : "", 'cols' : 5, 'display' : 'none'}
  var acCell = {'title' : "AC", 'text' : "", 'cols' : 5, 'display' : 'none'}
  var hpCell = {'title' : "HP", 'text' : "", 'cols' : 5, 'display' : 'none'}
  var notesCell = {'title' : "Notes", 'text' : "", 'cols' : 5, 'display' : 'none'}
  var row = [initCell, nameCell, hpCell, acCell, notesCell]
  var scn = new Scenario([row])
  return scn.generate();
}

export default function Home( { scenario }) {
  return (
    <>
      <Head>
        <title>Turn Tracker</title>
        <meta name="description" content="A Web App for tracking TTRPG turn-based scenarios"></meta>
        <link rel="icon" href="/favicon.ico"/>
      </Head>
      <nav className={styles.nav}>
        <div className={styles.nav_title}>Turn Tracker</div>
      </nav>
      <main className={styles.main}>
        {
          generate_5e_scenario(scenario) // TODO: Change this setting depending on selection
        }
      </main>
    </>
  )
}

export async function getServerSideProps(context) {
  var c;
  var id;
  let production = process.env.NODE_ENV === 'production'
  if (production) {
    id = context.req.cookies.scenarioId
  } else {
    c = context.req.headers.cookie
    if (c != undefined) { id = cookie.parse(c) }
  }
  var scenario = null;
  if (id != undefined) {
    const client = await getClient();
    let db;
    let scenarios;
    try {
        db = client.db("TurnTrackerDB")
        scenarios = db.collection("scenarios")
    } catch (e) {
        console.error(e)
    }	
    let result = null;
    try {
        let query;
        if (production) {
          const query = { "_id" : new ObjectId(id) }
        } else {
          const query = { "_id" : new ObjectId(id.scenarioId) }
        }
        result = await scenarios.findOne(query)
        scenario = JSON.parse(JSON.stringify(result.rows))
    } catch (e) {
        console.error(e)
    }
    
  }
  
  return { props: {scenario} }
}
