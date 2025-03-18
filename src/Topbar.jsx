
import { Link } from "react-router-dom";

function Topbar() {
  return (
    <nav className="p-4 bg-gray-100 drop-shadow-md w-screen grid grid-cols-[1fr_5fr] items-center text-3xl font-archivo font-bold">
      <h2 className="text-red-500 text-6xl mr-150"> <span class="text-red-800">SAVE.</span>PH</h2>
      <ul className="flex gap-10">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/news">News</Link></li>
        <li><Link to="/about">About Us</Link></li>
      </ul>
    </nav>
  );
}

export default Topbar;
