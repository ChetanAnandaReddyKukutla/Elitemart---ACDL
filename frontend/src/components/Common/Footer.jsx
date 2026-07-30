import React from "react";
import { Link } from "react-router-dom";
import { TbBrandMeta } from "react-icons/tb";
import { IoLogoInstagram } from "react-icons/io";
import { RiTwitterXLine } from "react-icons/ri";
import { FiPhoneCall } from "react-icons/fi";
import { pushDataLayerEvent } from "../../utils/analytics";

const Footer = () => {
  const handleNewsletterSubmit = (event) => {
    event.preventDefault();
    pushDataLayerEvent({
      event: "linkClick",
      linkInfo: {
        linkName: "newsletter subscribe",
        linkType: "form interaction",
        linkPosition: "footer newsletter",
        linkURL: window.location.href,
      },
    });
  };

  return (
    <footer className="border-t py-12">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-4 lg:px-0">
        <div>
          <h1 className="text-lg text-gray-800 mb-4">Newsletter</h1>
          <p className="text-gray-500 mb-4">
            Be the first to hear about our products, exclusive events ,and
            online offers.
          </p>
          <p className="font-medium text-sm text-gray-600 mb-6">
            {" "}
            Sign up and get 10% off on your first order.
          </p>
          <form className="flex" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              placeholder="Enter your email"
              className="p-3 w-full text-sm border-t border-l border-b border-gray-300 rounded-l-md focus:outline-none focus:ring-2 ring-gray-500 transition-all"
              required
            />
            <button
              type="submit"
              data-analytics-skip="true"
              className="bg-black text-white px-6 py-3 text-sm rounded-r-md hover:bg-gray-800 transition-all"
            >
              Subscribe
            </button>
          </form>
        </div>
        {/* Shop Links */}
        <div>
          <h3 className="text-lg text-gray-800 mb-4">Shop</h3>
          <ul className="space-y-2 text-gray-600">
            <li>
              <Link to={"#"} className="hover:text-gray-500 transition-colors">
                Men's Top Wear
              </Link>
            </li>
            <li>
              <Link to={"#"} className="hover:text-gray-500 transition-colors">
                Women's Top Wear
              </Link>
            </li>
            <li>
              <Link to={"#"} className="hover:text-gray-500 transition-colors">
                Men's Bottom Wear
              </Link>
            </li>
            <li>
              <Link to={"#"} className="hover:text-gray-500 transition-colors">
                Women's Bottom Wear
              </Link>
            </li>
          </ul>
        </div>
        {/* Support Links */}
        <div>
          <h3 className="text-lg text-gray-800 mb-4">Support</h3>
          <ul className="space-y-2 text-gray-600">
            <li>
              <Link to={"#"} className="hover:text-gray-500 transition-colors">
                Contact Us
              </Link>
            </li>
            <li>
              <Link to={"#"} className="hover:text-gray-500 transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link to={"#"} className="hover:text-gray-500 transition-colors">
                FAQs
              </Link>
            </li>
            <li>
              <Link to={"#"} className="hover:text-gray-500 transition-colors">
                Features
              </Link>
            </li>
          </ul>
        </div>
        {/* follow us */}
        <div>
          <h3 className="text-lg text-gray-800 mb-4">Follow Us</h3>
          <div className="flex items-center space-x-4 mb-6">
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-500"
              data-analytics-name="facebook"
              data-analytics-type="social media"
              data-analytics-position="footer"
            >
              <TbBrandMeta className="h-5 w-5" />
            </a>
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-500"
              data-analytics-name="instagram"
              data-analytics-type="social media"
              data-analytics-position="footer"
            >
              <IoLogoInstagram className="h-5 w-5" />
            </a>
            <a
              href="https://www.twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-500"
              data-analytics-name="x"
              data-analytics-type="social media"
              data-analytics-position="footer"
            >
              <RiTwitterXLine className="h-4 w-4" />
            </a>
          </div>
          <p className="text-gray-500">Call Us</p>
          <p>
            <FiPhoneCall className="inline-block mr-2" />
            0123-456-789
          </p>
        </div>
      </div>
      <div className="container mx-auto mt-12 px-4 lg:px-0 border-t border-gray-200 pt-6">
        <p className="text-gray-500 text-sm tracking-tighter text-center">© 2025, CompileTab. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
