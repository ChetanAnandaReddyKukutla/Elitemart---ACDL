import React, { useState } from "react";
import { HiMagnifyingGlass, HiMiniXMark } from "react-icons/hi2";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchProductsByFilters, setFilters } from "../../redux/slices/productsSlice";
import { trackSearchSubmit } from "../../utils/analytics";
const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSearchToggle = () => {
    setIsOpen(!isOpen);
  };
  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setFilters({ search: searchTerm }));
    dispatch(fetchProductsByFilters({ search: searchTerm })).then((response) => {
      const products = response.payload?.products || response.payload || [];
      trackSearchSubmit({
        searchTerm,
        resultCount: Array.isArray(products) ? products.length : 0,
      });
    });
    navigate(`/collections/all?search=${searchTerm}`);
    setIsOpen(false);
  };

  return (
    <div
      className={`flex items-center justify-center w-full transition-all duration-300 ${
        isOpen ? "absolute top-0 left-0 w-full bg-white h-24 z-50" : "w-auto"
      }`}
    >
      {isOpen ? (
        <form
          onSubmit={handleSearch}
          className="relative flex justify-center items-center w-full"
        >
          <div className="relative w-1/2">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              className="bg-gray-100 px-4 py-2 pl-2 pr-12 rounded-lg focus:outline-none w-full placeholder:text-gray-700"
            />
            <button
              type="submit"
              data-analytics-name="search submit"
              data-analytics-type="form interaction"
              data-analytics-position="header search"
              className="absolute cursor-pointer right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 "
            >
              <HiMagnifyingGlass className="h-6 w-6 " />
            </button>
          </div>
          <button
            type="button"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 cursor-pointer"
            onClick={handleSearchToggle}
            data-analytics-name="close search"
            data-analytics-type="search icon"
            data-analytics-position="header"
          >
            <HiMiniXMark className="w-6 h-6" />
          </button>
        </form>
      ) : (
        <button
          className="cursor-pointer"
          onClick={handleSearchToggle}
          data-analytics-name="search icon"
          data-analytics-type="search icon"
          data-analytics-position="header"
        >
          <HiMagnifyingGlass className="w-6 h-6 text-gray-700" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
