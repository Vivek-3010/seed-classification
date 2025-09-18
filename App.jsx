import React, { useState } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from "recharts";
import { motion } from "framer-motion";
import { FaSeedling, FaUpload, FaDownload } from "react-icons/fa";

function App() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => setFiles(e.target.files);

  const handleUpload = async () => {
    if (files.length === 0) return alert("Please select images!");

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) formData.append("file", files[i]); // key MUST match backend

    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:5001/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResults(res.data.results);
      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
      alert("Error uploading files! Make sure your backend is running on port 5001.");
    }
    setLoading(false);
  };

  const handleDownloadCSV = () => {
    if (results.length === 0) return;
    let csv = "Seed ID,Filename,Classification,Confidence,Severity,Pest Count,Holes Detected\n";
    results.forEach((r) => {
      csv += `${r.seed_id},${r.filename},${r.classification},${r.confidence},${r.severity},${r.pest_count},${r.holes_detected}\n`;
    });
    saveAs(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "results.csv");
  };

  return (
    <div className="bg-gradient-to-b from-green-50 to-green-100 min-h-screen font-sans py-10">
      {/* Header */}
      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1 }} className="text-center mb-12">
        <motion.div className="text-6xl text-green-700 inline-block animate-bounce">
          <FaSeedling />
        </motion.div>
        <h1 className="text-5xl font-extrabold mt-4 text-green-800">Soybean Seed Analyzer</h1>
        <p className="mt-2 text-xl text-green-700">
          AI-driven Seed Damage & Pest Infestation Analysis
        </p>
      </motion.div>

      {/* Upload Section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="max-w-4xl mx-auto mb-12 p-8 bg-white rounded-3xl shadow-xl border-l-8 border-green-500">
        <h2 className="text-2xl font-semibold mb-4 text-green-800">Upload Seed Images</h2>
        <input type="file" multiple onChange={handleFileChange} className="border-2 border-green-300 p-3 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-green-400 transition" />
        <div className="flex space-x-4">
          <button onClick={handleUpload} disabled={loading} className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-md">
            <FaUpload className="mr-2" />
            {loading ? "Analyzing..." : "Upload & Analyze"}
          </button>
          <button onClick={handleDownloadCSV} disabled={results.length === 0} className="flex items-center bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-md">
            <FaDownload className="mr-2" />
            Download CSV
          </button>
        </div>
      </motion.div>

      {/* Results */}
      {results.length > 0 && (
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="max-w-6xl mx-auto mb-12 p-8 bg-white rounded-3xl shadow-xl border-l-8 border-green-500">
          <h2 className="text-5xl font-semibold mb-6 text-green-800">Analysis Results</h2>

          <div className="overflow-x-auto mb-8">
            <table className="min-w-full border border-green-200 rounded-lg">
              <thead className="bg-green-100 text-green-800 font-bold">
                <tr>
                  <th className="p-3">Seed ID</th>
                 
                  <th className="p-3">Classification</th>
                  <th className="p-3">Confidence</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Pest Count</th>
                  <th className="p-3">Holes Detected</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.seed_id} className="border-t border-green-200 hover:bg-green-50 transition">
                    <td className="p-2 text-center">{r.seed_id}</td>
                 
                    <td className="p-2 text-center">{r.classification}</td>
                    <td className="p-2 text-center">{(r.confidence * 100).toFixed(2)}%</td>
                    <td className="p-2 text-center">{r.severity}</td>
                    <td className="p-2 text-center">{r.pest_count}</td>
                    <td className="p-2 text-center">{r.holes_detected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {summary && (
            <div className=" flex  justify-center items-center  md:grid-cols-2 gap-16">
              <div className="">
                <h3 className="text-4xl font-semibold mb-2 text-green-700">Summary</h3>
                <p className="text-2xl ">Total Seeds: {summary.total_seeds}</p>
                <p className="text-2xl ">Damaged Percentage: {summary.damaged_percentage}%</p>
                <p className="text-2xl ">Average Pest Count: {summary.avg_pest_count}</p>
              </div>

              <div>
                <h3 className="text-3xl ml-5 font-semibold mb-2 text-green-700">Severity Distribution</h3>
                <PieChart width={350} height={350}>
                  <Pie
                    data={Object.entries(summary.severity_distribution).map(([k, v]) => ({
                      name: `Severity ${k}`,
                      value: v,
                    }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    label
                  >
                    {["#4caf50", "#ff9800", "#f44336", "#9c27b0"].map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-12 flex flex-col items-center gap-2">
              <h3 className="text-4xl font-semibold mb-4 text-green-700">Pest Count Per Seed</h3>
              <BarChart width={800} height={400} data={results}>
                <XAxis dataKey="filename" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pest_count" fill="#82ca9d" />
              </BarChart>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default App;