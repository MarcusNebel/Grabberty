import { useState } from "react"

function App() {
  const [url, setUrl] = useState("")
  const [format, setFormat] = useState("1080p")

  return (
    <div className="w-full h-screen bg-[#232836] flex items-center justify-center">

      <div className="flex flex-col items-center gap-4">

        <h1 className="text-white text-3xl font-bold">
          Grabberty
        </h1>
        
        <div className="w-[700px] h-[80px] bg-zinc-600 p-4 rounded-full border-[2px] border-zinc-800 flex items-center">

          <input
          className="flex-1 bg-transparent text-white outline-none px-2"
          placeholder="Enter URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          />
          
          <select
            className="hover:bg-zinc-700 text-white px-3 py-2 rounded-full outline-none cursor-pointer"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            <option value="4k">4K</option>
            <option value="1080p">1080p</option>
            <option value="720p">720p</option>
            <option value="480p">480p</option>
            <option value="mp3">MP3</option>
          </select>

        </div>

        <button className="bg-red-500 text-white px-6 py-3 rounded-full hover:bg-red-600 transition">
          Download
        </button>

      </div>

    </div>
  )
}

export default App