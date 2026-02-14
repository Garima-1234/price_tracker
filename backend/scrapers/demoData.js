/**
 * Demo product data — fallback when live scraping fails
 */

const categories = {
    laptop: [
        { name: 'ASUS VivoBook 15 (2024) Core i5 12th Gen - 8GB RAM, 512GB SSD', image: 'https://m.media-amazon.com/images/I/71jG+e7roXL._SL1500_.jpg', brand: 'ASUS', category: 'Laptops', rating: 4.3, reviewCount: 12450, prices: { amazon: { price: 45990, url: 'https://www.amazon.in/s?k=asus+vivobook', inStock: true }, flipkart: { price: 44999, url: 'https://www.flipkart.com/search?q=asus+vivobook', inStock: true } } },
        { name: 'HP Pavilion 14 Core i5 13th Gen - 16GB RAM, 512GB SSD', image: 'https://m.media-amazon.com/images/I/71lJVLjhRlL._SL1500_.jpg', brand: 'HP', category: 'Laptops', rating: 4.4, reviewCount: 8920, prices: { amazon: { price: 56990, url: 'https://www.amazon.in/s?k=hp+pavilion', inStock: true }, flipkart: { price: 55490, url: 'https://www.flipkart.com/search?q=hp+pavilion', inStock: true } } },
        { name: 'Lenovo IdeaPad Slim 3 AMD Ryzen 5 - 8GB RAM, 512GB SSD', image: 'https://m.media-amazon.com/images/I/71PvHfU+pwL._SL1500_.jpg', brand: 'Lenovo', category: 'Laptops', rating: 4.2, reviewCount: 15680, prices: { amazon: { price: 38990, url: 'https://www.amazon.in/s?k=lenovo+ideapad', inStock: true }, flipkart: { price: 37999, url: 'https://www.flipkart.com/search?q=lenovo+ideapad', inStock: true } } },
        { name: 'Dell Inspiron 15 Core i3 1215U - 8GB RAM, 512GB SSD', image: 'https://m.media-amazon.com/images/I/71M7S2dROlL._SL1500_.jpg', brand: 'Dell', category: 'Laptops', rating: 4.1, reviewCount: 6340, prices: { amazon: { price: 34990, url: 'https://www.amazon.in/s?k=dell+inspiron', inStock: true }, flipkart: { price: 33999, url: 'https://www.flipkart.com/search?q=dell+inspiron', inStock: true } } },
    ],
    iphone: [
        { name: 'Apple iPhone 15 (128 GB) - Blue', image: 'https://m.media-amazon.com/images/I/71v2jVh6nIL._SL1500_.jpg', brand: 'Apple', category: 'Smartphones', rating: 4.6, reviewCount: 23400, prices: { amazon: { price: 69990, url: 'https://www.amazon.in/s?k=iphone+15', inStock: true }, flipkart: { price: 68999, url: 'https://www.flipkart.com/search?q=iphone+15', inStock: true } } },
        { name: 'Apple iPhone 15 Pro Max (256 GB) - Natural Titanium', image: 'https://m.media-amazon.com/images/I/81dT7CUY6GL._SL1500_.jpg', brand: 'Apple', category: 'Smartphones', rating: 4.7, reviewCount: 18900, prices: { amazon: { price: 156900, url: 'https://www.amazon.in/s?k=iphone+15+pro+max', inStock: true }, flipkart: { price: 155999, url: 'https://www.flipkart.com/search?q=iphone+15+pro+max', inStock: true } } },
        { name: 'Apple iPhone 14 (128 GB) - Midnight', image: 'https://m.media-amazon.com/images/I/61cwywLZR-L._SL1500_.jpg', brand: 'Apple', category: 'Smartphones', rating: 4.5, reviewCount: 45000, prices: { amazon: { price: 54999, url: 'https://www.amazon.in/s?k=iphone+14', inStock: true }, flipkart: { price: 53999, url: 'https://www.flipkart.com/search?q=iphone+14', inStock: true } } },
    ],
    'nike shoes': [
        { name: "Nike Air Max 270 React Men's Running Shoes", image: 'https://m.media-amazon.com/images/I/71HOCMFZA9L._UL1500_.jpg', brand: 'Nike', category: 'Shoes', rating: 4.4, reviewCount: 5670, prices: { amazon: { price: 8995, url: 'https://www.amazon.in/s?k=nike+air+max', inStock: true }, flipkart: { price: 8799, url: 'https://www.flipkart.com/search?q=nike+air+max', inStock: true }, myntra: { price: 8497, url: 'https://www.myntra.com/nike', inStock: true } } },
        { name: "Nike Revolution 6 Men's Road Running Shoes", image: 'https://m.media-amazon.com/images/I/71nlu1wTRBL._UL1500_.jpg', brand: 'Nike', category: 'Shoes', rating: 4.3, reviewCount: 12400, prices: { amazon: { price: 3695, url: 'https://www.amazon.in/s?k=nike+revolution', inStock: true }, flipkart: { price: 3499, url: 'https://www.flipkart.com/search?q=nike+revolution', inStock: true }, myntra: { price: 3295, url: 'https://www.myntra.com/nike', inStock: true } } },
        { name: "Nike Air Force 1 '07 Men's Shoes - White", image: 'https://m.media-amazon.com/images/I/61-clPy-nwL._UL1500_.jpg', brand: 'Nike', category: 'Shoes', rating: 4.6, reviewCount: 8900, prices: { amazon: { price: 7495, url: 'https://www.amazon.in/s?k=nike+air+force', inStock: true }, flipkart: { price: 7295, url: 'https://www.flipkart.com/search?q=nike+air+force', inStock: true }, myntra: { price: 6995, url: 'https://www.myntra.com/nike', inStock: true } } },
    ],
    headphones: [
        { name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones', image: 'https://m.media-amazon.com/images/I/51aXvjzcukL._SL1500_.jpg', brand: 'Sony', category: 'Headphones', rating: 4.6, reviewCount: 18700, prices: { amazon: { price: 26990, url: 'https://www.amazon.in/s?k=sony+wh1000xm5', inStock: true }, flipkart: { price: 25990, url: 'https://www.flipkart.com/search?q=sony+wh1000xm5', inStock: true } } },
        { name: 'Apple AirPods Pro (2nd Gen) with MagSafe Case', image: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._SL1500_.jpg', brand: 'Apple', category: 'Headphones', rating: 4.7, reviewCount: 34500, prices: { amazon: { price: 24900, url: 'https://www.amazon.in/s?k=airpods+pro', inStock: true }, flipkart: { price: 24490, url: 'https://www.flipkart.com/search?q=airpods+pro', inStock: true } } },
        { name: 'boAt Rockerz 450 Bluetooth On-Ear Headphone', image: 'https://m.media-amazon.com/images/I/61Kz9CjnKhL._SL1500_.jpg', brand: 'boAt', category: 'Headphones', rating: 4.1, reviewCount: 145000, prices: { amazon: { price: 1299, url: 'https://www.amazon.in/s?k=boat+rockerz', inStock: true }, flipkart: { price: 1199, url: 'https://www.flipkart.com/search?q=boat+rockerz', inStock: true } } },
    ],
    'samsung tv': [
        { name: 'Samsung 108 cm (43 inch) Crystal 4K UHD Smart LED TV', image: 'https://m.media-amazon.com/images/I/71RnPCHSC1L._SL1500_.jpg', brand: 'Samsung', category: 'Television', rating: 4.3, reviewCount: 23400, prices: { amazon: { price: 29990, url: 'https://www.amazon.in/s?k=samsung+tv', inStock: true }, flipkart: { price: 28999, url: 'https://www.flipkart.com/search?q=samsung+tv', inStock: true } } },
        { name: 'Samsung 138 cm (55 inch) Neo QLED Smart TV', image: 'https://m.media-amazon.com/images/I/71LJJrKbezL._SL1500_.jpg', brand: 'Samsung', category: 'Television', rating: 4.5, reviewCount: 8700, prices: { amazon: { price: 54990, url: 'https://www.amazon.in/s?k=samsung+neo+qled', inStock: true }, flipkart: { price: 52999, url: 'https://www.flipkart.com/search?q=samsung+neo+qled', inStock: true } } },
    ],
    'smart watch': [
        { name: 'Apple Watch Series 9 GPS 41mm Aluminium Case', image: 'https://m.media-amazon.com/images/I/71xJalblRWL._SL1500_.jpg', brand: 'Apple', category: 'Smartwatches', rating: 4.7, reviewCount: 12300, prices: { amazon: { price: 39900, url: 'https://www.amazon.in/s?k=apple+watch', inStock: true }, flipkart: { price: 38999, url: 'https://www.flipkart.com/search?q=apple+watch', inStock: true } } },
        { name: 'Noise ColorFit Pro 5 Max 1.96" AMOLED Smart Watch', image: 'https://m.media-amazon.com/images/I/61Dd62MSksL._SL1500_.jpg', brand: 'Noise', category: 'Smartwatches', rating: 4.1, reviewCount: 34000, prices: { amazon: { price: 3999, url: 'https://www.amazon.in/s?k=noise+colorfit', inStock: true }, flipkart: { price: 3799, url: 'https://www.flipkart.com/search?q=noise+colorfit', inStock: true } } },
    ],
    phone: [
        { name: 'Samsung Galaxy S24 Ultra 5G (Titanium Gray, 12GB, 256GB)', image: 'https://m.media-amazon.com/images/I/71lHprdqJLL._SL1500_.jpg', brand: 'Samsung', category: 'Smartphones', rating: 4.5, reviewCount: 14500, prices: { amazon: { price: 129999, url: 'https://www.amazon.in/s?k=samsung+s24+ultra', inStock: true }, flipkart: { price: 127999, url: 'https://www.flipkart.com/search?q=samsung+s24+ultra', inStock: true } } },
        { name: 'OnePlus 12 5G (Silky Black, 12GB RAM, 256GB)', image: 'https://m.media-amazon.com/images/I/71K43LNnAvL._SL1500_.jpg', brand: 'OnePlus', category: 'Smartphones', rating: 4.4, reviewCount: 8900, prices: { amazon: { price: 64999, url: 'https://www.amazon.in/s?k=oneplus+12', inStock: true }, flipkart: { price: 63999, url: 'https://www.flipkart.com/search?q=oneplus+12', inStock: true } } },
        { name: 'Redmi Note 13 Pro+ 5G (8GB, 256GB, 200MP)', image: 'https://m.media-amazon.com/images/I/71HAunWMDIL._SL1500_.jpg', brand: 'Xiaomi', category: 'Smartphones', rating: 4.2, reviewCount: 34000, prices: { amazon: { price: 29999, url: 'https://www.amazon.in/s?k=redmi+note+13', inStock: true }, flipkart: { price: 28999, url: 'https://www.flipkart.com/search?q=redmi+note+13', inStock: true } } },
    ],
    sweatshirt: [
        { name: 'Allen Solly Men Solid Hooded Sweatshirt - Navy Blue', image: 'https://m.media-amazon.com/images/I/51Y3FAL2RUL._UL1100_.jpg', brand: 'Allen Solly', category: 'Sweatshirts', rating: 4.2, reviewCount: 8400, prices: { amazon: { price: 1299, url: 'https://www.amazon.in/s?k=sweatshirt+men', inStock: true }, flipkart: { price: 1199, url: 'https://www.flipkart.com/search?q=sweatshirt', inStock: true }, myntra: { price: 1049, url: 'https://www.myntra.com/sweatshirts', inStock: true }, ajio: { price: 1149, url: 'https://www.ajio.com/search?q=sweatshirt', inStock: true } } },
        { name: 'US Polo Assn Men Full Sleeve Crew Neck Sweatshirt', image: 'https://m.media-amazon.com/images/I/61vxrGKMVBL._UL1100_.jpg', brand: 'US Polo', category: 'Sweatshirts', rating: 4.3, reviewCount: 5600, prices: { amazon: { price: 1799, url: 'https://www.amazon.in/s?k=us+polo+sweatshirt', inStock: true }, flipkart: { price: 1699, url: 'https://www.flipkart.com/search?q=us+polo+sweatshirt', inStock: true }, myntra: { price: 1549, url: 'https://www.myntra.com/sweatshirts', inStock: true } } },
        { name: 'H&M Oversized Hoodie Sweatshirt - Black', image: 'https://m.media-amazon.com/images/I/61qKBzMeaoL._UL1100_.jpg', brand: 'H&M', category: 'Sweatshirts', rating: 4.4, reviewCount: 12000, prices: { amazon: { price: 1999, url: 'https://www.amazon.in/s?k=hm+hoodie', inStock: true }, myntra: { price: 1499, url: 'https://www.myntra.com/sweatshirts', inStock: true }, ajio: { price: 1599, url: 'https://www.ajio.com/search?q=hoodie', inStock: true } } },
        { name: 'Roadster Men Printed Hooded Sweatshirt - Olive Green', image: 'https://m.media-amazon.com/images/I/51sAgJzL9EL._UL1100_.jpg', brand: 'Roadster', category: 'Sweatshirts', rating: 4.1, reviewCount: 23000, prices: { amazon: { price: 899, url: 'https://www.amazon.in/s?k=roadster+sweatshirt', inStock: true }, flipkart: { price: 849, url: 'https://www.flipkart.com/search?q=roadster+sweatshirt', inStock: true }, myntra: { price: 699, url: 'https://www.myntra.com/sweatshirts', inStock: true } } },
        { name: 'Puma Men ESS Big Logo Crew Sweatshirt - Grey', image: 'https://m.media-amazon.com/images/I/61gIF-OZHFL._UL1100_.jpg', brand: 'Puma', category: 'Sweatshirts', rating: 4.3, reviewCount: 6700, prices: { amazon: { price: 2499, url: 'https://www.amazon.in/s?k=puma+sweatshirt', inStock: true }, flipkart: { price: 2399, url: 'https://www.flipkart.com/search?q=puma+sweatshirt', inStock: true }, myntra: { price: 2199, url: 'https://www.myntra.com/sweatshirts', inStock: true }, ajio: { price: 2299, url: 'https://www.ajio.com/search?q=puma+sweatshirt', inStock: true } } },
    ],
    tshirt: [
        { name: 'US Polo Assn Men Solid Round Neck T-Shirt - Pack of 3', image: 'https://m.media-amazon.com/images/I/71wiuT3xJrL._UL1500_.jpg', brand: 'US Polo', category: 'T-Shirts', rating: 4.2, reviewCount: 45000, prices: { amazon: { price: 899, url: 'https://www.amazon.in/s?k=tshirt+men', inStock: true }, flipkart: { price: 849, url: 'https://www.flipkart.com/search?q=tshirt', inStock: true }, myntra: { price: 799, url: 'https://www.myntra.com/tshirts', inStock: true } } },
        { name: 'Nike Dri-FIT Men Training T-Shirt - Black', image: 'https://m.media-amazon.com/images/I/61-clPy-nwL._UL1500_.jpg', brand: 'Nike', category: 'T-Shirts', rating: 4.5, reviewCount: 8700, prices: { amazon: { price: 1495, url: 'https://www.amazon.in/s?k=nike+tshirt', inStock: true }, flipkart: { price: 1395, url: 'https://www.flipkart.com/search?q=nike+tshirt', inStock: true }, myntra: { price: 1295, url: 'https://www.myntra.com/tshirts', inStock: true } } },
        { name: 'H&M Regular Fit Cotton T-Shirt - White', image: 'https://m.media-amazon.com/images/I/61QGJHsbX1L._UL1100_.jpg', brand: 'H&M', category: 'T-Shirts', rating: 4.3, reviewCount: 15000, prices: { amazon: { price: 599, url: 'https://www.amazon.in/s?k=hm+tshirt', inStock: true }, myntra: { price: 499, url: 'https://www.myntra.com/tshirts', inStock: true }, ajio: { price: 549, url: 'https://www.ajio.com/search?q=tshirt', inStock: true } } },
        { name: 'Bewakoof Men Printed Oversized T-Shirt', image: 'https://m.media-amazon.com/images/I/51U17SZEIDL._UL1100_.jpg', brand: 'Bewakoof', category: 'T-Shirts', rating: 4.0, reviewCount: 67000, prices: { amazon: { price: 499, url: 'https://www.amazon.in/s?k=bewakoof+tshirt', inStock: true }, flipkart: { price: 449, url: 'https://www.flipkart.com/search?q=bewakoof+tshirt', inStock: true }, myntra: { price: 399, url: 'https://www.myntra.com/tshirts', inStock: true } } },
    ],
    jeans: [
        { name: "Levi's Men 511 Slim Fit Mid-Rise Jeans - Dark Blue", image: 'https://m.media-amazon.com/images/I/61tX2hNcxAL._UL1500_.jpg', brand: "Levi's", category: 'Jeans', rating: 4.3, reviewCount: 24000, prices: { amazon: { price: 2499, url: 'https://www.amazon.in/s?k=levis+jeans', inStock: true }, flipkart: { price: 2399, url: 'https://www.flipkart.com/search?q=levis+jeans', inStock: true }, myntra: { price: 2199, url: 'https://www.myntra.com/jeans', inStock: true }, ajio: { price: 2299, url: 'https://www.ajio.com/search?q=levis+jeans', inStock: true } } },
        { name: 'Wrangler Men Slim Fit Stretchable Jeans - Black', image: 'https://m.media-amazon.com/images/I/61X+dmR3PEL._UL1500_.jpg', brand: 'Wrangler', category: 'Jeans', rating: 4.2, reviewCount: 12000, prices: { amazon: { price: 1899, url: 'https://www.amazon.in/s?k=wrangler+jeans', inStock: true }, flipkart: { price: 1799, url: 'https://www.flipkart.com/search?q=wrangler+jeans', inStock: true }, myntra: { price: 1649, url: 'https://www.myntra.com/jeans', inStock: true } } },
        { name: 'Roadster Men Slim Fit Mid-Rise Jeans - Blue', image: 'https://m.media-amazon.com/images/I/61hB-HBOHOL._UL1500_.jpg', brand: 'Roadster', category: 'Jeans', rating: 4.1, reviewCount: 45000, prices: { amazon: { price: 799, url: 'https://www.amazon.in/s?k=roadster+jeans', inStock: true }, flipkart: { price: 749, url: 'https://www.flipkart.com/search?q=roadster+jeans', inStock: true }, myntra: { price: 649, url: 'https://www.myntra.com/jeans', inStock: true } } },
    ],
    jacket: [
        { name: 'Wildcraft Men Windbreaker Jacket - Navy Blue', image: 'https://m.media-amazon.com/images/I/61dbOE-RJGL._UL1500_.jpg', brand: 'Wildcraft', category: 'Jackets', rating: 4.2, reviewCount: 5600, prices: { amazon: { price: 2499, url: 'https://www.amazon.in/s?k=jacket+men', inStock: true }, flipkart: { price: 2399, url: 'https://www.flipkart.com/search?q=jacket', inStock: true }, myntra: { price: 2199, url: 'https://www.myntra.com/jackets', inStock: true } } },
        { name: 'Puma Men Solid Bomber Jacket - Black', image: 'https://m.media-amazon.com/images/I/71bDqoCwy7L._UL1500_.jpg', brand: 'Puma', category: 'Jackets', rating: 4.4, reviewCount: 3400, prices: { amazon: { price: 3999, url: 'https://www.amazon.in/s?k=puma+jacket', inStock: true }, flipkart: { price: 3799, url: 'https://www.flipkart.com/search?q=puma+jacket', inStock: true }, myntra: { price: 3499, url: 'https://www.myntra.com/jackets', inStock: true } } },
        { name: 'H&M Padded Winter Jacket - Olive', image: 'https://m.media-amazon.com/images/I/51rfSb2BBBL._UL1100_.jpg', brand: 'H&M', category: 'Jackets', rating: 4.3, reviewCount: 8900, prices: { amazon: { price: 2999, url: 'https://www.amazon.in/s?k=hm+jacket', inStock: true }, myntra: { price: 2499, url: 'https://www.myntra.com/jackets', inStock: true }, ajio: { price: 2699, url: 'https://www.ajio.com/search?q=jacket', inStock: true } } },
    ],
    backpack: [
        { name: 'Skybags Brat 46 cms Casual Backpack - Black', image: 'https://m.media-amazon.com/images/I/81QqOhBCalL._SL1500_.jpg', brand: 'Skybags', category: 'Backpacks', rating: 4.1, reviewCount: 56000, prices: { amazon: { price: 999, url: 'https://www.amazon.in/s?k=backpack', inStock: true }, flipkart: { price: 899, url: 'https://www.flipkart.com/search?q=backpack', inStock: true } } },
        { name: 'American Tourister 32L Laptop Backpack', image: 'https://m.media-amazon.com/images/I/81k5eSPiJaL._SL1500_.jpg', brand: 'American Tourister', category: 'Backpacks', rating: 4.3, reviewCount: 34000, prices: { amazon: { price: 1499, url: 'https://www.amazon.in/s?k=american+tourister+backpack', inStock: true }, flipkart: { price: 1399, url: 'https://www.flipkart.com/search?q=american+tourister', inStock: true } } },
    ],
    camera: [
        { name: 'Canon EOS R50 Mirrorless Camera with RF-S 18-45mm Lens', image: 'https://m.media-amazon.com/images/I/71UMiGV5BpL._SL1500_.jpg', brand: 'Canon', category: 'Cameras', rating: 4.5, reviewCount: 3200, prices: { amazon: { price: 69990, url: 'https://www.amazon.in/s?k=canon+eos+r50', inStock: true }, flipkart: { price: 68490, url: 'https://www.flipkart.com/search?q=canon+eos+r50', inStock: true } } },
        { name: 'Sony Alpha A6400 Mirrorless Camera Body Only', image: 'https://m.media-amazon.com/images/I/71yQT4gbQ5L._SL1500_.jpg', brand: 'Sony', category: 'Cameras', rating: 4.6, reviewCount: 5600, prices: { amazon: { price: 79990, url: 'https://www.amazon.in/s?k=sony+a6400', inStock: true }, flipkart: { price: 78999, url: 'https://www.flipkart.com/search?q=sony+a6400', inStock: true } } },
    ],
    tablet: [
        { name: 'Apple iPad 10th Generation (64GB, Wi-Fi) - Blue', image: 'https://m.media-amazon.com/images/I/61nSl-A3b2L._SL1500_.jpg', brand: 'Apple', category: 'Tablets', rating: 4.6, reviewCount: 12000, prices: { amazon: { price: 37900, url: 'https://www.amazon.in/s?k=ipad+10th+gen', inStock: true }, flipkart: { price: 36999, url: 'https://www.flipkart.com/search?q=ipad+10th+gen', inStock: true } } },
        { name: 'Samsung Galaxy Tab S9 FE 10.9" (6GB, 128GB)', image: 'https://m.media-amazon.com/images/I/71LigLXFMeL._SL1500_.jpg', brand: 'Samsung', category: 'Tablets', rating: 4.4, reviewCount: 4500, prices: { amazon: { price: 34999, url: 'https://www.amazon.in/s?k=samsung+tab+s9', inStock: true }, flipkart: { price: 33999, url: 'https://www.flipkart.com/search?q=samsung+tab+s9', inStock: true } } },
    ],
};

// Map common search terms to categories
const aliases = {
    'laptops': 'laptop', 'notebook': 'laptop', 'macbook': 'laptop',
    'iphone 15': 'iphone', 'iphone 14': 'iphone', 'iphone 13': 'iphone', 'apple iphone': 'iphone',
    'mobile': 'phone', 'phones': 'phone', 'smartphone': 'phone', 'smartphones': 'phone', 'samsung phone': 'phone', 'oneplus': 'phone', 'redmi': 'phone',
    'nike': 'nike shoes', 'shoes': 'nike shoes', 'sneakers': 'nike shoes', 'running shoes': 'nike shoes',
    'earphones': 'headphones', 'earbuds': 'headphones', 'airpods': 'headphones', 'headphone': 'headphones',
    'tv': 'samsung tv', 'television': 'samsung tv', 'samsung': 'samsung tv', 'smart tv': 'samsung tv',
    'watch': 'smart watch', 'smartwatch': 'smart watch', 'apple watch': 'smart watch', 'fitness band': 'smart watch',
    'sweatshirts': 'sweatshirt', 'hoodie': 'sweatshirt', 'hoodies': 'sweatshirt', 'pullover': 'sweatshirt',
    't-shirt': 'tshirt', 't shirt': 'tshirt', 'tshirts': 'tshirt', 't-shirts': 'tshirt', 'top': 'tshirt', 'tops': 'tshirt',
    'denim': 'jeans', 'pants': 'jeans', 'trousers': 'jeans',
    'jackets': 'jacket', 'coat': 'jacket', 'winter jacket': 'jacket', 'bomber jacket': 'jacket',
    'bag': 'backpack', 'bags': 'backpack', 'school bag': 'backpack', 'laptop bag': 'backpack',
    'cameras': 'camera', 'dslr': 'camera', 'mirrorless': 'camera',
    'ipad': 'tablet', 'tablets': 'tablet', 'tab': 'tablet',
};

/**
 * Generate dynamic products for any search query not in demo data
 */
function generateDynamicProducts(query) {
    const q = query.charAt(0).toUpperCase() + query.slice(1);
    const brands = ['Generic', 'Premium', 'ProMax', 'UltraFit', 'StyleX'];
    const products = [];

    for (let i = 0; i < 4; i++) {
        const brand = brands[i];
        const basePrice = 500 + Math.floor(Math.random() * 5000);
        const amazonPrice = basePrice + Math.floor(Math.random() * 300);
        const flipkartPrice = basePrice + Math.floor(Math.random() * 200);
        const myntraPrice = basePrice - Math.floor(Math.random() * 100);

        products.push({
            name: `${brand} ${q} - Premium Quality (${['Black', 'Blue', 'Grey', 'White'][i]})`,
            image: `https://via.placeholder.com/400x400/6c5ce7/ffffff?text=${encodeURIComponent(q)}`,
            brand,
            category: q,
            rating: +(3.8 + Math.random() * 0.9).toFixed(1),
            reviewCount: 1000 + Math.floor(Math.random() * 20000),
            prices: {
                amazon: { price: amazonPrice, url: `https://www.amazon.in/s?k=${encodeURIComponent(query)}`, inStock: true, lastUpdated: new Date() },
                flipkart: { price: flipkartPrice, url: `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`, inStock: true, lastUpdated: new Date() },
                myntra: { price: myntraPrice, url: `https://www.myntra.com/${encodeURIComponent(query)}`, inStock: true, lastUpdated: new Date() },
            }
        });
    }
    return products;
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
        if (q.includes(alias) || alias.includes(q)) return categories[cat] || [];
    }

    // No match found — generate dynamic products for this query
    console.log(`📝 No demo data for "${query}" — generating dynamic products`);
    return generateDynamicProducts(query);
}

module.exports = { getDemoProducts };
