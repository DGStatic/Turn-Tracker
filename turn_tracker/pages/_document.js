import { Stylish } from '@next/font/google'
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body style = {{margin: 0, backgroundColor: "#252f43"}}>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
