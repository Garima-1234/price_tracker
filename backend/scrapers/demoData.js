/**
 * Demo product data — fallback when live scraping fails
 * Prices updated March 2025 (verified against live Flipkart/Amazon)
 */

const categories = {
    laptop: [
        { name: 'ASUS VivoBook 15 (2024) Core i5 12th Gen - 8GB RAM, 512GB SSD', image: 'https://m.media-amazon.com/images/I/71jG+e7roXL._SL1500_.jpg', brand: 'ASUS', category: 'Laptops', rating: 4.3, reviewCount: 12450, prices: { amazon: { price: 47990, mrp: 58990, url: 'https://www.amazon.in/s?k=asus+vivobook', inStock: true }, flipkart: { price: 46999, mrp: 58990, url: 'https://www.flipkart.com/search?q=asus+vivobook', inStock: true } } },
        { name: 'HP Pavilion 14 Core i5 13th Gen - 16GB RAM, 512GB SSD', image: 'https://m.media-amazon.com/images/I/71lJVLjhRlL._SL1500_.jpg', brand: 'HP', category: 'Laptops', rating: 4.4, reviewCount: 8920, prices: { amazon: { price: 57990, mrp: 72990, url: 'https://www.amazon.in/s?k=hp+pavilion', inStock: true }, flipkart: { price: 56490, mrp: 72990, url: 'https://www.flipkart.com/search?q=hp+pavilion', inStock: true } } },
        { name: 'Lenovo IdeaPad Slim 3 AMD Ryzen 5 7520U - 8GB RAM, 512GB SSD', image: 'https://m.media-amazon.com/images/I/71PvHfU+pwL._SL1500_.jpg', brand: 'Lenovo', category: 'Laptops', rating: 4.2, reviewCount: 15680, prices: { amazon: { price: 36990, mrp: 52890, url: 'https://www.amazon.in/s?k=lenovo+ideapad', inStock: true }, flipkart: { price: 35999, mrp: 52890, url: 'https://www.flipkart.com/search?q=lenovo+ideapad', inStock: true } } },
        { name: 'Dell Inspiron 15 Core i3 1215U - 8GB RAM, 512GB SSD', image: 'https://m.media-amazon.com/images/I/71M7S2dROlL._SL1500_.jpg', brand: 'Dell', category: 'Laptops', rating: 4.1, reviewCount: 6340, prices: { amazon: { price: 37490, mrp: 54990, url: 'https://www.amazon.in/s?k=dell+inspiron', inStock: true }, flipkart: { price: 36499, mrp: 54990, url: 'https://www.flipkart.com/search?q=dell+inspiron', inStock: true } } },
        { name: 'Apple MacBook Air M2 (2023) 13" - 8GB, 256GB SSD', image: 'https://m.media-amazon.com/images/I/71f5Eu5lJSL._SL1500_.jpg', brand: 'Apple', category: 'Laptops', rating: 4.7, reviewCount: 18900, prices: { amazon: { price: 99900, mrp: 114900, url: 'https://www.amazon.in/s?k=macbook+air+m2', inStock: true }, flipkart: { price: 99900, mrp: 114900, url: 'https://www.flipkart.com/search?q=macbook+air+m2', inStock: true } } },
    ],
    iphone: [
        { name: 'Apple iPhone 16 (128 GB) - Black', image: 'https://m.media-amazon.com/images/I/61bK6PMOC3L._SL1500_.jpg', brand: 'Apple', category: 'Smartphones', rating: 4.5, reviewCount: 14200, prices: { amazon: { price: 79900, mrp: 79900, url: 'https://www.amazon.in/s?k=iphone+16', inStock: true }, flipkart: { price: 79900, mrp: 79900, url: 'https://www.flipkart.com/search?q=iphone+16', inStock: true } } },
        { name: 'Apple iPhone 15 (128 GB) - Blue', image: 'https://m.media-amazon.com/images/I/71v2jVh6nIL._SL1500_.jpg', brand: 'Apple', category: 'Smartphones', rating: 4.6, reviewCount: 23400, prices: { amazon: { price: 67900, mrp: 79900, url: 'https://www.amazon.in/s?k=iphone+15', inStock: true }, flipkart: { price: 67999, mrp: 79900, url: 'https://www.flipkart.com/search?q=iphone+15', inStock: true } } },
        { name: 'Apple iPhone 15 Pro Max (256 GB) - Natural Titanium', image: 'https://m.media-amazon.com/images/I/81dT7CUY6GL._SL1500_.jpg', brand: 'Apple', category: 'Smartphones', rating: 4.7, reviewCount: 18900, prices: { amazon: { price: 148900, mrp: 159900, url: 'https://www.amazon.in/s?k=iphone+15+pro+max', inStock: true }, flipkart: { price: 147999, mrp: 159900, url: 'https://www.flipkart.com/search?q=iphone+15+pro+max', inStock: true } } },
        { name: 'Apple iPhone 14 (128 GB) - Midnight', image: 'https://m.media-amazon.com/images/I/61cwywLZR-L._SL1500_.jpg', brand: 'Apple', category: 'Smartphones', rating: 4.5, reviewCount: 45000, prices: { amazon: { price: 56900, mrp: 69900, url: 'https://www.amazon.in/s?k=iphone+14', inStock: true }, flipkart: { price: 55999, mrp: 69900, url: 'https://www.flipkart.com/search?q=iphone+14', inStock: true } } },
        { name: 'Apple iPhone 13 (128 GB) - Midnight', image: 'https://m.media-amazon.com/images/I/71xLP2GnnoL._SL1500_.jpg', brand: 'Apple', category: 'Smartphones', rating: 4.6, reviewCount: 68000, prices: { amazon: { price: 45900, mrp: 59900, url: 'https://www.amazon.in/s?k=iphone+13', inStock: true }, flipkart: { price: 44999, mrp: 59900, url: 'https://www.flipkart.com/search?q=iphone+13', inStock: true } } },
    ],
    'nike shoes': [
        { name: "Nike Air Max 270 Men's Running Shoes", image: 'https://m.media-amazon.com/images/I/71HOCMFZA9L._UL1500_.jpg', brand: 'Nike', category: 'Shoes', rating: 4.4, reviewCount: 5670, prices: { amazon: { price: 9995, mrp: 12995, url: 'https://www.amazon.in/s?k=nike+air+max', inStock: true }, flipkart: { price: 8999, mrp: 12995, url: 'https://www.flipkart.com/search?q=nike+air+max', inStock: true }, myntra: { price: 8497, mrp: 12995, url: 'https://www.myntra.com/nike', inStock: true } } },
        { name: "Nike Revolution 6 Men's Road Running Shoes", image: 'https://m.media-amazon.com/images/I/71nlu1wTRBL._UL1500_.jpg', brand: 'Nike', category: 'Shoes', rating: 4.3, reviewCount: 12400, prices: { amazon: { price: 3995, mrp: 5295, url: 'https://www.amazon.in/s?k=nike+revolution', inStock: true }, flipkart: { price: 3699, mrp: 5295, url: 'https://www.flipkart.com/search?q=nike+revolution', inStock: true }, myntra: { price: 3499, mrp: 5295, url: 'https://www.myntra.com/nike', inStock: true } } },
        { name: "Nike Air Force 1 '07 Men's Shoes - White", image: 'https://m.media-amazon.com/images/I/61-clPy-nwL._UL1500_.jpg', brand: 'Nike', category: 'Shoes', rating: 4.6, reviewCount: 8900, prices: { amazon: { price: 7495, mrp: 9295, url: 'https://www.amazon.in/s?k=nike+air+force', inStock: true }, flipkart: { price: 7295, mrp: 9295, url: 'https://www.flipkart.com/search?q=nike+air+force', inStock: true }, myntra: { price: 6995, mrp: 9295, url: 'https://www.myntra.com/nike', inStock: true } } },
    ],
    headphones: [
        { name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones (Black)', image: 'https://m.media-amazon.com/images/I/51aXvjzcukL._SL1500_.jpg', brand: 'Sony', category: 'Headphones', rating: 4.6, reviewCount: 18700, prices: { amazon: { price: 26990, mrp: 34990, url: 'https://www.amazon.in/dp/B09XS7JWHH', inStock: true }, flipkart: { price: 27989, mrp: 34990, url: 'https://www.flipkart.com/sony-wh-1000xm5-bluetooth-headset/p/itm9ee097bc0ae76', inStock: true } } },
        { name: 'Sony WH-1000XM4 Wireless Noise Cancelling Headphones', image: 'https://m.media-amazon.com/images/I/71o8Q5XJS5L._SL1500_.jpg', brand: 'Sony', category: 'Headphones', rating: 4.5, reviewCount: 34000, prices: { amazon: { price: 19990, mrp: 29990, url: 'https://www.amazon.in/s?k=sony+wh1000xm4', inStock: true }, flipkart: { price: 19490, mrp: 29990, url: 'https://www.flipkart.com/search?q=sony+wh1000xm4', inStock: true } } },
        { name: 'Apple AirPods Pro (2nd Gen) with MagSafe Case (USB-C)', image: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._SL1500_.jpg', brand: 'Apple', category: 'Headphones', rating: 4.7, reviewCount: 34500, prices: { amazon: { price: 24900, mrp: 26900, url: 'https://www.amazon.in/s?k=airpods+pro+2nd+gen', inStock: true }, flipkart: { price: 24490, mrp: 26900, url: 'https://www.flipkart.com/search?q=airpods+pro+2nd+gen', inStock: true } } },
        { name: 'boAt Rockerz 450 Bluetooth On-Ear Headphone with Mic', image: 'https://m.media-amazon.com/images/I/61Kz9CjnKhL._SL1500_.jpg', brand: 'boAt', category: 'Headphones', rating: 4.1, reviewCount: 145000, prices: { amazon: { price: 1099, mrp: 3990, url: 'https://www.amazon.in/s?k=boat+rockerz', inStock: true }, flipkart: { price: 999, mrp: 3990, url: 'https://www.flipkart.com/search?q=boat+rockerz', inStock: true } } },
        { name: 'JBL Tune 770NC Adaptive Noise Cancelling Wireless Headphones', image: 'https://m.media-amazon.com/images/I/71E4TW+CHQL._SL1500_.jpg', brand: 'JBL', category: 'Headphones', rating: 4.3, reviewCount: 8900, prices: { amazon: { price: 7999, mrp: 14999, url: 'https://www.amazon.in/s?k=jbl+tune+770nc', inStock: true }, flipkart: { price: 7499, mrp: 14999, url: 'https://www.flipkart.com/search?q=jbl+tune+770nc', inStock: true } } },
    ],
    'samsung tv': [
        { name: 'Samsung 108 cm (43") Crystal 4K UHD Smart LED TV (UA43CUE60BKLXL)', image: 'https://m.media-amazon.com/images/I/71RnPCHSC1L._SL1500_.jpg', brand: 'Samsung', category: 'Television', rating: 4.3, reviewCount: 23400, prices: { amazon: { price: 32990, mrp: 56900, url: 'https://www.amazon.in/s?k=samsung+43+tv', inStock: true }, flipkart: { price: 31999, mrp: 56900, url: 'https://www.flipkart.com/search?q=samsung+43+inch+tv', inStock: true } } },
        { name: 'Samsung 139 cm (55") Crystal 4K UHD Smart LED TV', image: 'https://m.media-amazon.com/images/I/71LJJrKbezL._SL1500_.jpg', brand: 'Samsung', category: 'Television', rating: 4.4, reviewCount: 12300, prices: { amazon: { price: 49990, mrp: 85900, url: 'https://www.amazon.in/s?k=samsung+55+tv', inStock: true }, flipkart: { price: 47999, mrp: 85900, url: 'https://www.flipkart.com/search?q=samsung+55+inch+tv', inStock: true } } },
        { name: 'Samsung 138 cm (55") Neo QLED 4K Smart TV (QA55QN85DBKXXL)', image: 'https://m.media-amazon.com/images/I/71R4sAMlolL._SL1500_.jpg', brand: 'Samsung', category: 'Television', rating: 4.5, reviewCount: 8700, prices: { amazon: { price: 129990, mrp: 260000, url: 'https://www.amazon.in/s?k=samsung+neo+qled', inStock: true }, flipkart: { price: 127999, mrp: 260000, url: 'https://www.flipkart.com/search?q=samsung+neo+qled', inStock: true } } },
    ],
    'smart watch': [
        { name: 'Apple Watch Series 10 GPS 42mm Aluminium', image: 'https://m.media-amazon.com/images/I/71xJalblRWL._SL1500_.jpg', brand: 'Apple', category: 'Smartwatches', rating: 4.7, reviewCount: 12300, prices: { amazon: { price: 46900, mrp: 46900, url: 'https://www.amazon.in/s?k=apple+watch+series+10', inStock: true }, flipkart: { price: 46900, mrp: 46900, url: 'https://www.flipkart.com/search?q=apple+watch+series+10', inStock: true } } },
        { name: 'Noise ColorFit Pro 5 Max 1.96" AMOLED Smart Watch', image: 'https://m.media-amazon.com/images/I/61Dd62MSksL._SL1500_.jpg', brand: 'Noise', category: 'Smartwatches', rating: 4.1, reviewCount: 34000, prices: { amazon: { price: 2999, mrp: 9999, url: 'https://www.amazon.in/s?k=noise+colorfit', inStock: true }, flipkart: { price: 2799, mrp: 9999, url: 'https://www.flipkart.com/search?q=noise+colorfit', inStock: true } } },
        { name: 'Samsung Galaxy Watch 7 40mm Bluetooth Smartwatch', image: 'https://m.media-amazon.com/images/I/61nU+bANRRL._SL1500_.jpg', brand: 'Samsung', category: 'Smartwatches', rating: 4.3, reviewCount: 6700, prices: { amazon: { price: 25999, mrp: 31999, url: 'https://www.amazon.in/s?k=samsung+galaxy+watch+7', inStock: true }, flipkart: { price: 24999, mrp: 31999, url: 'https://www.flipkart.com/search?q=samsung+galaxy+watch+7', inStock: true } } },
    ],
    phone: [
        { name: 'Samsung Galaxy S25 Ultra 5G (Titanium Black, 12GB, 256GB)', image: 'https://m.media-amazon.com/images/I/71lHprdqJLL._SL1500_.jpg', brand: 'Samsung', category: 'Smartphones', rating: 4.5, reviewCount: 14500, prices: { amazon: { price: 129999, mrp: 131999, url: 'https://www.amazon.in/s?k=samsung+s25+ultra', inStock: true }, flipkart: { price: 129999, mrp: 131999, url: 'https://www.flipkart.com/search?q=samsung+s25+ultra', inStock: true } } },
        { name: 'OnePlus 13 5G (Midnight Ocean, 12GB RAM, 256GB)', image: 'https://m.media-amazon.com/images/I/71K43LNnAvL._SL1500_.jpg', brand: 'OnePlus', category: 'Smartphones', rating: 4.4, reviewCount: 8900, prices: { amazon: { price: 69999, mrp: 69999, url: 'https://www.amazon.in/s?k=oneplus+13', inStock: true }, flipkart: { price: 69999, mrp: 69999, url: 'https://www.flipkart.com/search?q=oneplus+13', inStock: true } } },
        { name: 'Redmi Note 13 Pro+ 5G (8GB, 256GB, 200MP Camera)', image: 'https://m.media-amazon.com/images/I/71HAunWMDIL._SL1500_.jpg', brand: 'Xiaomi', category: 'Smartphones', rating: 4.2, reviewCount: 34000, prices: { amazon: { price: 30999, mrp: 35999, url: 'https://www.amazon.in/s?k=redmi+note+13+pro+plus', inStock: true }, flipkart: { price: 29999, mrp: 35999, url: 'https://www.flipkart.com/search?q=redmi+note+13+pro+plus', inStock: true } } },
        { name: 'POCO X6 Pro 5G (12GB RAM, 256GB) - Spectre Black', image: 'https://m.media-amazon.com/images/I/71XVeA6jwBL._SL1500_.jpg', brand: 'POCO', category: 'Smartphones', rating: 4.3, reviewCount: 22000, prices: { amazon: { price: 22999, mrp: 27999, url: 'https://www.amazon.in/s?k=poco+x6+pro', inStock: true }, flipkart: { price: 21999, mrp: 27999, url: 'https://www.flipkart.com/search?q=poco+x6+pro', inStock: true } } },
    ],
    sweatshirt: [
        { name: 'Allen Solly Men Solid Hooded Sweatshirt - Navy Blue', image: 'https://m.media-amazon.com/images/I/51Y3FAL2RUL._UL1100_.jpg', brand: 'Allen Solly', category: 'Sweatshirts', rating: 4.2, reviewCount: 8400, prices: { amazon: { price: 1099, mrp: 2199, url: 'https://www.amazon.in/s?k=sweatshirt+men', inStock: true }, flipkart: { price: 999, mrp: 2199, url: 'https://www.flipkart.com/search?q=sweatshirt', inStock: true }, myntra: { price: 899, mrp: 2199, url: 'https://www.myntra.com/sweatshirts', inStock: true }, ajio: { price: 949, mrp: 2199, url: 'https://www.ajio.com/search?q=sweatshirt', inStock: true } } },
        { name: 'Puma Men ESS Big Logo Crew Sweatshirt - Grey', image: 'https://m.media-amazon.com/images/I/61gIF-OZHFL._UL1100_.jpg', brand: 'Puma', category: 'Sweatshirts', rating: 4.3, reviewCount: 6700, prices: { amazon: { price: 2249, mrp: 3999, url: 'https://www.amazon.in/s?k=puma+sweatshirt', inStock: true }, flipkart: { price: 2099, mrp: 3999, url: 'https://www.flipkart.com/search?q=puma+sweatshirt', inStock: true }, myntra: { price: 1999, mrp: 3999, url: 'https://www.myntra.com/sweatshirts', inStock: true }, ajio: { price: 2149, mrp: 3999, url: 'https://www.ajio.com/search?q=puma+sweatshirt', inStock: true } } },
    ],
    tshirt: [
        { name: 'US Polo Assn Men Solid Round Neck T-Shirt - Pack of 3', image: 'https://m.media-amazon.com/images/I/71wiuT3xJrL._UL1500_.jpg', brand: 'US Polo', category: 'T-Shirts', rating: 4.2, reviewCount: 45000, prices: { amazon: { price: 799, mrp: 1499, url: 'https://www.amazon.in/s?k=tshirt+men', inStock: true }, flipkart: { price: 749, mrp: 1499, url: 'https://www.flipkart.com/search?q=tshirt', inStock: true }, myntra: { price: 699, mrp: 1499, url: 'https://www.myntra.com/tshirts', inStock: true } } },
        { name: 'Nike Dri-FIT Men Training T-Shirt - Black', image: 'https://m.media-amazon.com/images/I/61-clPy-nwL._UL1500_.jpg', brand: 'Nike', category: 'T-Shirts', rating: 4.5, reviewCount: 8700, prices: { amazon: { price: 1295, mrp: 1995, url: 'https://www.amazon.in/s?k=nike+tshirt', inStock: true }, flipkart: { price: 1195, mrp: 1995, url: 'https://www.flipkart.com/search?q=nike+tshirt', inStock: true }, myntra: { price: 1095, mrp: 1995, url: 'https://www.myntra.com/tshirts', inStock: true } } },
    ],
    jeans: [
        { name: "Levi's Men 511 Slim Fit Mid-Rise Jeans - Dark Blue", image: 'https://m.media-amazon.com/images/I/61tX2hNcxAL._UL1500_.jpg', brand: "Levi's", category: 'Jeans', rating: 4.3, reviewCount: 24000, prices: { amazon: { price: 2399, mrp: 3799, url: 'https://www.amazon.in/s?k=levis+jeans', inStock: true }, flipkart: { price: 2249, mrp: 3799, url: 'https://www.flipkart.com/search?q=levis+jeans', inStock: true }, myntra: { price: 2099, mrp: 3799, url: 'https://www.myntra.com/jeans', inStock: true }, ajio: { price: 2199, mrp: 3799, url: 'https://www.ajio.com/search?q=levis+jeans', inStock: true } } },
        { name: 'Wrangler Men Slim Fit Stretchable Jeans - Black', image: 'https://m.media-amazon.com/images/I/61X+dmR3PEL._UL1500_.jpg', brand: 'Wrangler', category: 'Jeans', rating: 4.2, reviewCount: 12000, prices: { amazon: { price: 1699, mrp: 2999, url: 'https://www.amazon.in/s?k=wrangler+jeans', inStock: true }, flipkart: { price: 1599, mrp: 2999, url: 'https://www.flipkart.com/search?q=wrangler+jeans', inStock: true }, myntra: { price: 1499, mrp: 2999, url: 'https://www.myntra.com/jeans', inStock: true } } },
    ],
    jacket: [
        { name: 'Wildcraft Men Windbreaker Jacket - Navy Blue', image: 'https://m.media-amazon.com/images/I/61dbOE-RJGL._UL1500_.jpg', brand: 'Wildcraft', category: 'Jackets', rating: 4.2, reviewCount: 5600, prices: { amazon: { price: 1999, mrp: 3499, url: 'https://www.amazon.in/s?k=jacket+men', inStock: true }, flipkart: { price: 1899, mrp: 3499, url: 'https://www.flipkart.com/search?q=jacket', inStock: true }, myntra: { price: 1799, mrp: 3499, url: 'https://www.myntra.com/jackets', inStock: true } } },
        { name: 'Puma Men Solid Bomber Jacket - Black', image: 'https://m.media-amazon.com/images/I/71bDqoCwy7L._UL1500_.jpg', brand: 'Puma', category: 'Jackets', rating: 4.4, reviewCount: 3400, prices: { amazon: { price: 2999, mrp: 4999, url: 'https://www.amazon.in/s?k=puma+jacket', inStock: true }, flipkart: { price: 2799, mrp: 4999, url: 'https://www.flipkart.com/search?q=puma+jacket', inStock: true }, myntra: { price: 2699, mrp: 4999, url: 'https://www.myntra.com/jackets', inStock: true } } },
    ],
    backpack: [
        { name: 'Skybags Brat 46 cms Casual Backpack - Black', image: 'https://m.media-amazon.com/images/I/81QqOhBCalL._SL1500_.jpg', brand: 'Skybags', category: 'Backpacks', rating: 4.1, reviewCount: 56000, prices: { amazon: { price: 699, mrp: 1995, url: 'https://www.amazon.in/s?k=backpack', inStock: true }, flipkart: { price: 649, mrp: 1995, url: 'https://www.flipkart.com/search?q=backpack', inStock: true } } },
        { name: 'American Tourister 32L Laptop Backpack', image: 'https://m.media-amazon.com/images/I/81k5eSPiJaL._SL1500_.jpg', brand: 'American Tourister', category: 'Backpacks', rating: 4.3, reviewCount: 34000, prices: { amazon: { price: 1349, mrp: 3995, url: 'https://www.amazon.in/s?k=american+tourister+backpack', inStock: true }, flipkart: { price: 1249, mrp: 3995, url: 'https://www.flipkart.com/search?q=american+tourister', inStock: true } } },
    ],
    camera: [
        { name: 'Canon EOS R50 Mirrorless Camera with RF-S 18-45mm Lens', image: 'https://m.media-amazon.com/images/I/71UMiGV5BpL._SL1500_.jpg', brand: 'Canon', category: 'Cameras', rating: 4.5, reviewCount: 3200, prices: { amazon: { price: 64990, mrp: 89995, url: 'https://www.amazon.in/s?k=canon+eos+r50', inStock: true }, flipkart: { price: 63490, mrp: 89995, url: 'https://www.flipkart.com/search?q=canon+eos+r50', inStock: true } } },
        { name: 'Sony Alpha A6400 Mirrorless Camera Body Only', image: 'https://m.media-amazon.com/images/I/71yQT4gbQ5L._SL1500_.jpg', brand: 'Sony', category: 'Cameras', rating: 4.6, reviewCount: 5600, prices: { amazon: { price: 73990, mrp: 87990, url: 'https://www.amazon.in/s?k=sony+a6400', inStock: true }, flipkart: { price: 72999, mrp: 87990, url: 'https://www.flipkart.com/search?q=sony+a6400', inStock: true } } },
    ],
    tablet: [
        { name: 'Apple iPad 10th Generation (64GB, Wi-Fi) - Blue', image: 'https://m.media-amazon.com/images/I/61nSl-A3b2L._SL1500_.jpg', brand: 'Apple', category: 'Tablets', rating: 4.6, reviewCount: 12000, prices: { amazon: { price: 33900, mrp: 44900, url: 'https://www.amazon.in/s?k=ipad+10th+gen', inStock: true }, flipkart: { price: 32999, mrp: 44900, url: 'https://www.flipkart.com/search?q=ipad+10th+gen', inStock: true } } },
        { name: 'Samsung Galaxy Tab S9 FE 10.9" (6GB, 128GB)', image: 'https://m.media-amazon.com/images/I/71LigLXFMeL._SL1500_.jpg', brand: 'Samsung', category: 'Tablets', rating: 4.4, reviewCount: 4500, prices: { amazon: { price: 29999, mrp: 44999, url: 'https://www.amazon.in/s?k=samsung+tab+s9+fe', inStock: true }, flipkart: { price: 28999, mrp: 44999, url: 'https://www.flipkart.com/search?q=samsung+tab+s9+fe', inStock: true } } },
    ],
};

// Map common search terms to categories
const aliases = {
    'laptops': 'laptop', 'notebook': 'laptop', 'macbook': 'laptop', 'vivobook': 'laptop', 'ideapad': 'laptop',
    'iphone 16': 'iphone', 'iphone 15': 'iphone', 'iphone 14': 'iphone', 'iphone 13': 'iphone', 'apple iphone': 'iphone',
    'mobile': 'phone', 'phones': 'phone', 'smartphone': 'phone', 'smartphones': 'phone', 'samsung phone': 'phone',
    'oneplus': 'phone', 'redmi': 'phone', 'poco': 'phone', 'galaxy': 'phone', 'vivo': 'phone', 'oppo': 'phone', 'realme': 'phone',
    'nike': 'nike shoes', 'shoes': 'nike shoes', 'sneakers': 'nike shoes', 'running shoes': 'nike shoes', 'footwear': 'nike shoes',
    'earphones': 'headphones', 'earbuds': 'headphones', 'airpods': 'headphones', 'headphone': 'headphones',
    'wh1000xm5': 'headphones', 'wh-1000xm5': 'headphones', 'xm5': 'headphones', 'xm4': 'headphones', 'sony headphones': 'headphones',
    'boat': 'headphones', 'jbl': 'headphones', 'bose': 'headphones',
    'tv': 'samsung tv', 'television': 'samsung tv', 'samsung tv': 'samsung tv', 'smart tv': 'samsung tv', 'led tv': 'samsung tv',
    'watch': 'smart watch', 'smartwatch': 'smart watch', 'apple watch': 'smart watch', 'fitness band': 'smart watch', 'noise watch': 'smart watch',
    'sweatshirts': 'sweatshirt', 'hoodie': 'sweatshirt', 'hoodies': 'sweatshirt', 'pullover': 'sweatshirt',
    't-shirt': 'tshirt', 't shirt': 'tshirt', 'tshirts': 'tshirt', 't-shirts': 'tshirt', 'top': 'tshirt',
    'denim': 'jeans', 'pants': 'jeans', 'trousers': 'jeans', 'levis': 'jeans', 'jeans for men': 'jeans',
    'jackets': 'jacket', 'coat': 'jacket', 'winter jacket': 'jacket', 'bomber jacket': 'jacket',
    'bag': 'backpack', 'bags': 'backpack', 'school bag': 'backpack', 'laptop bag': 'backpack',
    'cameras': 'camera', 'dslr': 'camera', 'mirrorless': 'camera', 'canon': 'camera',
    'ipad': 'tablet', 'tablets': 'tablet', 'tab': 'tablet',
};

/**
 * Generate realistic products for queries not in demo data.
 * Uses keyword-based price ranges instead of random numbers.
 */
function generateDynamicProducts(query) {
    const q = query.toLowerCase().trim();
    const qTitle = query.charAt(0).toUpperCase() + query.slice(1);

    // Keyword → price range lookup (basePrice in ₹)
    const priceMap = [
        { keywords: ['gpu', 'graphics card', 'rtx', 'rx 7900'], base: 45000, top: 150000 },
        { keywords: ['cpu', 'processor', 'ryzen', 'core i9'], base: 15000, top: 60000 },
        { keywords: ['gaming chair', 'office chair'], base: 8000, top: 35000 },
        { keywords: ['monitor', 'display'], base: 9000, top: 60000 },
        { keywords: ['keyboard', 'mechanical keyboard'], base: 1500, top: 15000 },
        { keywords: ['mouse', 'gaming mouse'], base: 500, top: 8000 },
        { keywords: ['speaker', 'bluetooth speaker'], base: 1000, top: 20000 },
        { keywords: ['refrigerator', 'fridge'], base: 15000, top: 80000 },
        { keywords: ['washing machine'], base: 12000, top: 70000 },
        { keywords: ['air conditioner', 'ac', 'split ac'], base: 28000, top: 90000 },
        { keywords: ['cycles', 'cycle', 'bicycle'], base: 5000, top: 40000 },
        { keywords: ['helmet'], base: 500, top: 5000 },
        { keywords: ['perfume', 'deo', 'deodorant'], base: 300, top: 3000 },
        { keywords: ['sunglasses'], base: 500, top: 5000 },
        { keywords: ['wallet', 'purse'], base: 300, top: 3000 },
        { keywords: ['belt'], base: 300, top: 2000 },
        { keywords: ['watch'], base: 2000, top: 20000 },
        { keywords: ['mixer', 'grinder', 'juicer'], base: 1500, top: 8000 },
        { keywords: ['cooler', 'air cooler', 'fan'], base: 3000, top: 15000 },
        { keywords: ['trimmer', 'shaver', 'razor'], base: 800, top: 6000 },
        { keywords: ['power bank'], base: 700, top: 4000 },
        { keywords: ['charger', 'cable', 'adapter'], base: 300, top: 3000 },
        { keywords: ['earphone', 'earbud', 'iem'], base: 500, top: 8000 },
        { keywords: ['headphone'], base: 700, top: 12000 },
        { keywords: ['printer'], base: 5000, top: 25000 },
        { keywords: ['router', 'wifi'], base: 1000, top: 8000 },
        { keywords: ['pendrive', 'usb drive', 'flash drive'], base: 300, top: 3000 },
        { keywords: ['ssd', 'hard disk', 'hdd'], base: 2000, top: 20000 },
        { keywords: ['ram', 'memory'], base: 1500, top: 10000 },
        { keywords: ['shoes', 'sneaker', 'boot'], base: 1500, top: 12000 },
        { keywords: ['tshirt', 't-shirt', 'shirt'], base: 400, top: 3000 },
        { keywords: ['jeans', 'pant', 'trouser'], base: 600, top: 5000 },
        { keywords: ['kurta', 'kurti', 'saree'], base: 500, top: 6000 },
        { keywords: ['bag', 'backpack'], base: 500, top: 5000 },
    ];

    let base = 1000, top = 5000;
    for (const entry of priceMap) {
        if (entry.keywords.some(k => q.includes(k))) {
            base = entry.base; top = entry.top; break;
        }
    }

    const brands = ['Generic', 'Premium', 'ProMax', 'StyleX'];
    const platforms = ['amazon', 'flipkart', 'myntra'];
    const colors = ['Black', 'Blue', 'Grey', 'White'];

    return brands.slice(0, 4).map((brand, i) => {
        // Deterministic price within range (no random) — use brand index
        const spread = top - base;
        const brandPrice = Math.round(base + (spread * (i * 0.2)));
        const mrp = Math.round(brandPrice * 1.3);
        const amazonPrice = brandPrice;
        const flipkartPrice = Math.round(brandPrice * 0.97);
        const myntraPrice = Math.round(brandPrice * 0.94);

        return {
            name: `${brand} ${qTitle} - ${colors[i]} Edition`,
            image: `https://placehold.co/400x400/6c5ce7/ffffff?text=${encodeURIComponent(qTitle)}`,
            brand,
            category: qTitle,
            rating: +(3.8 + i * 0.15).toFixed(1),
            reviewCount: 1200 + i * 3500,
            prices: {
                amazon:   { price: amazonPrice,   mrp, url: `https://www.amazon.in/s?k=${encodeURIComponent(query)}`,   inStock: true, lastUpdated: new Date() },
                flipkart: { price: flipkartPrice, mrp, url: `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`, inStock: true, lastUpdated: new Date() },
                myntra:   { price: myntraPrice,   mrp, url: `https://www.myntra.com/${encodeURIComponent(query).replace(/%20/g, '-')}`,   inStock: true, lastUpdated: new Date() },
            }
        };
    });
}

function getDemoProducts(query) {
    const q = query.toLowerCase().trim();

    // Direct match
    if (categories[q]) return categories[q];

    // Alias match
    if (aliases[q] && categories[aliases[q]]) return categories[aliases[q]];

    // Partial match in category names
    for (const [keyword, products] of Object.entries(categories)) {
        if (q.includes(keyword) || keyword.includes(q)) return products;
    }

    // Partial match in aliases
    for (const [alias, cat] of Object.entries(aliases)) {
        if ((q.includes(alias) || alias.includes(q)) && categories[cat]) return categories[cat];
    }

    // No match — generate deterministic products
    console.log(`📝 No demo data for "${query}" — generating deterministic products`);
    return generateDynamicProducts(query);
}

module.exports = { getDemoProducts };
