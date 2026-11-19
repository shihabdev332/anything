import Header from "./component/Header";
import Banner from "./component/Banner";
import Sell from "./component/Sell";
import NewArrival from "./component/NewArrival";
import Recommended from "./component/Recommended";
import TopSelling from "./component/TopSelling";
import TopRated from "./component/TopRated";
import AiChat from "./component/AiChat"; //
import Seo from "./component/Seo";
import { absoluteUrl } from "./utils/seoUtils";

const homeSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${absoluteUrl("/")}#organization`,
      name: "Digital Store",
      url: absoluteUrl("/"),
      logo: absoluteUrl("/favicon.png"),
    },
    {
      "@type": "WebSite",
      "@id": `${absoluteUrl("/")}#website`,
      name: "Digital Store",
      url: absoluteUrl("/"),
      publisher: { "@id": `${absoluteUrl("/")}#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${absoluteUrl("/search")}?query={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "WebPage",
      "@id": `${absoluteUrl("/")}#webpage`,
      url: absoluteUrl("/"),
      name: "Digital Store | Shop products from independent sellers",
      isPartOf: { "@id": `${absoluteUrl("/")}#website` },
      about: { "@id": `${absoluteUrl("/")}#organization` },
    },
  ],
};

const App = () => {
  return (
    <main className="relative">
      <Seo
        title="Digital Store | Shop products from independent sellers"
        description="Discover products from independent sellers on Digital Store. Browse the marketplace, explore seller stores and shop online."
        path="/"
        jsonLd={homeSchema}
      />
      <Banner />
      <NewArrival />
      <Sell />
      <TopSelling />
      <TopRated />
      <Recommended />

      
      <AiChat /> 
    </main>
  );
};

export default App;
