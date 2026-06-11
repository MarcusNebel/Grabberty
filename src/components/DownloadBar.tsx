import { useState } from "react"
import icon from "../assets/Grabberty_Logo.svg"

function App() {
  const [url, setUrl] = useState("")
  const [format, setFormat] = useState("1080p")

  return (
    <div className="w-full h-screen bg-[#0E0E0F] flex items-center justify-center">

      <div className="flex flex-col items-center gap-14">

        <div className="flex flex-col items-center text-center gap-3">

          <img src={icon} className="w-12 h-12 mb-3" />

          <h1 className="text-white text-4xl font-bold">
            Grabberty
          </h1>

          <p className="text-white">
            Fast, simple and high-quality self-hosted downloader
          </p>
        </div>

        <div className="w-[700px] bg-[#1B1B1D] p-4 rounded-[30px] border-[2px] border-zinc-800 flex items-center gap-4">

          <div className="flex-1 h-[50px] bg-[#242427] rounded-[15px] flex items-center">
            <input
              className="flex-1 bg-transparent text-white outline-none px-3"
              placeholder="Enter URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              />
          </div>

            <button className="w-[160px] h-[50px] bg-[#E53925] rounded-[10px] text-white font-bold hover:bg-[#b82f1f] transition">
                Next
              </button>

        </div>

      </div>

    </div>
  )
}

export default App