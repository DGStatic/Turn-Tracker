import Head from 'next/head'
import Image from 'next/image'
import { Inter, Waiting_for_the_Sunrise } from '@next/font/google'
import styles from '@/styles/Home.module.css'

import { v4 as uuidv4 } from 'uuid';
import { useState, useEffect, setState } from 'react';

const inter = Inter({ subsets: ['latin'] })


class Scenario {
  constructor(rows = []) {
    this.rows = rows;
    for (var i = 0; i < rows.length; i++) {
      this.rows[i].id = i;
    }
  }

  generate() {
    console.log("generating scenario...");
    return (
      <button>+</button>,
      <div className={styles.scenario}>
        {
          this.rows.map( (row, i)=>(
            row.generate()
          ))
        }
      </div>
    )
  }

  add_row()  {
    this.rows.push(new Row(this.rows.length));
  }

  duplicate_row() {
    this.rows.push(new Row(this.rows.length, this.rows[this.rows.length-1].cells ))
  }

  delete_row() {

  }
}

class Row {
  constructor(id = 0, cells = [new Cell()]) {
    this.cells = cells;
    for (var i = 0; i < cells.length; i++) {
      this.cells[i].id = i;
      console.log(this.cells[i].id);
    }
    this.id = id;
  }

  generate() {

    return (
      <div className={styles.row} key={this.id}>
        {
          this.cells.map( (cell, j)=>(
            cell.generate(cell)
          ))
        }
        <button className={styles.new_cell_btn}>+</button>
      </div>
    )
  }

  handle_new_cell() {

  }

  add_cell() {
    this.cells.push(new Cell(this.cells.length))
  }
}

class Cell {
  constructor(id = 0, title = "Title", text = "" ) {
    this.title = title;
    this.text = text;
    this.id = id;
    this.cols = 6;
    if (title.length > 6) {
      this.cols = title.length+1;
    }
  }

  handleChange(event) {
    event.target.cols = event.target.value.length
    if (event.target.cols < 4) {event.target.cols = 4;}
  }

  generate() {
    return (
      <div key={this.id} className={styles.cell}>
        <textarea className={styles.text} onChange={this.handleChange} type="text" defaultValue={this.title} placeholder="Title" cols={this.cols}/>
        <textarea className={styles.text} onChange={this.handleChange} type="text" placeholder={this.id} cols={this.cols}/>
      </div>
      
    )
  }
}

function generate_scenario() {
  var scn = new Scenario();
  scn.add_row();
  return scn.generate();
}

function generate_5e_scenario() {
  var initCell = new Cell(undefined, "Initiative", undefined)
  var nameCell = new Cell(undefined, "Name", undefined)
  var acCell = new Cell(undefined, "AC", undefined)
  var hpCell = new Cell(undefined, "Hit Points", undefined)
  var notesCell = new Cell(undefined, "Notes", undefined)
  var row = new Row(undefined, [initCell, nameCell, acCell, hpCell, notesCell] )
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
          generate_5e_scenario()
        }
      </main>
    </>
  )
}
