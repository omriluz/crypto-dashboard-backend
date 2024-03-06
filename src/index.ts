import express, { Express, Request, Response } from "express"
import dotenv from "dotenv"
import fs from "fs/promises"
import { NEWS_DATA_FILE_NAME } from "./constants/news-data"

dotenv.config()

const app: Express = express()
const port = process.env.PORT || 3000

// Function to fetch news data from API
const fetchNewsData = async () => {
  const yesterdayFormatted = getYesterdayFormattedDate()
  const apiKey = process.env.NEWSAPI_API_KEY || ""

  const searchParams = new URLSearchParams({
    q: "bitcoin",
    from: yesterdayFormatted,
    pageSize: "8",
    sortBy: "relevancy",
    language: "en",
    apiKey,
  })

  const newsDataResponse = await fetch(
    `https://newsapi.org/v2/everything?${searchParams}`
  )

  return {
    date: yesterdayFormatted,
    data: await newsDataResponse.json(),
  }
}

// Function to read cached news data from JSON file
const readNewsDataFromFile = async () => {
  try {
    const fileContent = await fs.readFile(NEWS_DATA_FILE_NAME, "utf-8")
    return JSON.parse(fileContent)
  } catch (error) {
    console.warn("Error:", error)
    return null
  }
}

// Middleware to check if cached data exists in JSON file and serve it if available
app.get("/news-data", async (req: Request, res: Response) => {
  console.count('count')
  try {
    const cachedData = await readNewsDataFromFile()
    if (cachedData && cachedData.date === getYesterdayFormattedDate()) {
      // If cached data exists and is from yesterday, serve it
      res.send(cachedData.data)
    } else {
      // If cached data doesn't exist or is outdated, fetch new data, update JSON file, and serve it
      const newsData = await fetchNewsData()
      await fs.writeFile(NEWS_DATA_FILE_NAME, JSON.stringify(newsData))
      res.send(newsData.data)
    }
  } catch (error) {
    console.error("Error:", error)
    res.status(500).send("Internal Server Error")
  }
})

// Function to get yesterday's date in YYYY-MM-DD format
const getYesterdayFormattedDate = () => {
  const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
  return yesterday.toISOString().split("T")[0]
}

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`)
})
