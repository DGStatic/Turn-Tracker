import Head from 'next/head'
import Image from 'next/image'
import { Inter } from '@next/font/google'
import styles from '@/styles/Home.module.css'

const inter = Inter({ subsets: ['latin'] })

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
          <option>D&D 5e</option>
          <option>Pathfinder 2e</option>
        </select>
        <div class="scenario">
          <div class="row">
            <div class="cell">
              
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
