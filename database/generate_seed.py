#!/usr/bin/env python3
"""
Omekart Taxonomy Seed Generator
Generates SQL to seed taxonomy_nodes, category_attribute_definitions,
and filter_blueprints with all extra columns for production.
Run: python3 generate_seed.py
Output: omekart_taxonomy_seed.sql (in the current folder)
"""

import uuid
import json
import os

def q(s):
    """Escape single quotes for SQL."""
    return s.replace("'", "''")

def uid():
    return str(uuid.uuid4())

# --------------------------------------------------------------------
# TAXONOMY STRUCTURE
# --------------------------------------------------------------------
products_id = uid()
foods_id = uid()
services_id = uid()

TAXONOMY = [
    # ===================================================================
    # PRODUCTS
    # ===================================================================
    (products_id, "products", [
        ("Electronics & Gadgets", "electronics", [
            ("Smartphones & Accessories", "smartphones",
                [
                    ("brand", "Brand", "select", True, ["Apple","Samsung","Tecno","Infinix","Itel","Xiaomi","OnePlus","Google"]),
                    ("storage", "Storage (GB)", "select", True, ["16","32","64","128","256","512"]),
                    ("ram", "RAM (GB)", "select", True, ["2","3","4","6","8","12","16"]),
                    ("condition", "Condition", "select", True, ["Brand New","UK Used","Nigerian Used"]),
                    ("colour", "Colour", "text", False, None),
                    ("battery", "Battery (mAh)", "number", False, None),
                    ("screen_size", "Screen Size (inch)", "number", False, None),
                ],
                [
                    ("brand", "Brand", "multi_checkbox"),
                    ("storage", "Storage", "multi_checkbox"),
                    ("ram", "RAM", "multi_checkbox"),
                    ("condition", "Condition", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Laptops & Computers", "laptops",
                [
                    ("brand", "Brand", "select", True, ["Apple","Dell","HP","Lenovo","Asus","Acer","MSI","Microsoft"]),
                    ("processor", "Processor", "select", True, ["Intel Core i3","Intel Core i5","Intel Core i7","Intel Core i9","AMD Ryzen 5","AMD Ryzen 7","Apple M1","Apple M2","Apple M3"]),
                    ("ram", "RAM (GB)", "select", True, ["4","8","16","32","64"]),
                    ("storage", "Storage", "select", True, ["256GB SSD","512GB SSD","1TB SSD","1TB HDD","2TB HDD"]),
                    ("screen_size", "Screen Size (inch)", "select", True, ["11","13","14","15","16","17"]),
                    ("condition", "Condition", "select", True, ["Brand New","UK Used","Nigerian Used","Refurbished"]),
                    ("gpu", "Graphics Card", "text", False, None),
                ],
                [
                    ("brand", "Brand", "multi_checkbox"),
                    ("processor", "Processor", "multi_checkbox"),
                    ("ram", "RAM", "multi_checkbox"),
                    ("condition", "Condition", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("TVs & Home Theatre", "tvs",
                [
                    ("brand", "Brand", "select", True, ["Samsung","LG","Sony","Hisense","TCL","Skyworth","Panasonic"]),
                    ("screen_size", "Screen Size (inch)", "select", True, ["24","32","40","43","50","55","65","75","85"]),
                    ("resolution", "Resolution", "select", True, ["HD (720p)","Full HD (1080p)","4K UHD","8K"]),
                    ("smart_tv", "Smart TV?", "boolean", True, None),
                    ("condition", "Condition", "select", True, ["Brand New","UK Used","Nigerian Used"]),
                ],
                [
                    ("brand", "Brand", "multi_checkbox"),
                    ("screen_size", "Screen Size", "multi_checkbox"),
                    ("resolution", "Resolution", "multi_checkbox"),
                    ("smart_tv", "Smart TV", "toggle"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Audio & Headphones", "audio",
                [
                    ("brand", "Brand", "text", True, None),
                    ("type", "Type", "select", True, ["Over-Ear Headphones","In-Ear Earbuds","TWS Earbuds","Neckband","Bluetooth Speaker","Soundbar","Home Speaker"]),
                    ("connectivity", "Connectivity", "select", True, ["Wired","Bluetooth","Both"]),
                    ("condition", "Condition", "select", True, ["Brand New","UK Used","Nigerian Used"]),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("connectivity", "Connectivity", "multi_checkbox"),
                    ("condition", "Condition", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Gaming", "gaming",
                [
                    ("category", "Category", "select", True, ["Console","Game CD/Cartridge","Controller","Gaming Headset","Gaming Chair","PC Gaming Peripheral"]),
                    ("platform", "Platform", "select", False, ["PlayStation 5","PlayStation 4","Xbox Series X/S","Xbox One","Nintendo Switch","PC","Mobile"]),
                    ("condition", "Condition", "select", True, ["Brand New","UK Used","Nigerian Used"]),
                ],
                [
                    ("category", "Category", "multi_checkbox"),
                    ("platform", "Platform", "multi_checkbox"),
                    ("condition", "Condition", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
        ]),
        ("Fashion & Clothing", "fashion", [
            ("Men's Clothing", "mens-clothing",
                [
                    ("type", "Type", "select", True, ["Shirts","Trousers","Suits","Agbada","Kaftan","Shorts","Jeans","Jackets & Coats","Traditional Attire"]),
                    ("size", "Size", "select", True, ["XS","S","M","L","XL","XXL","XXXL","Custom"]),
                    ("material", "Material", "text", False, None),
                    ("colour", "Colour", "text", False, None),
                    ("brand", "Brand", "text", False, None),
                    ("condition", "Condition", "select", True, ["Brand New","Thrift (Tokunbo)"]),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("size", "Size", "multi_checkbox"),
                    ("condition", "Condition", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Women's Clothing", "womens-clothing",
                [
                    ("type", "Type", "select", True, ["Dresses","Tops & Blouses","Skirts","Trousers","Abayas","Iro & Buba","Jumpsuits","Jackets","Lingerie"]),
                    ("size", "Size", "select", True, ["XS","S","M","L","XL","XXL","XXXL","Custom"]),
                    ("material", "Material", "text", False, None),
                    ("colour", "Colour", "text", False, None),
                    ("condition", "Condition", "select", True, ["Brand New","Thrift (Tokunbo)"]),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("size", "Size", "multi_checkbox"),
                    ("condition", "Condition", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Shoes & Footwear", "shoes",
                [
                    ("type", "Type", "select", True, ["Sneakers","Slippers & Sandals","Heels","Loafers","Boots","Dress Shoes","Sport Shoes"]),
                    ("gender", "Gender", "select", True, ["Men","Women","Unisex","Kids"]),
                    ("size", "Size (EU)", "select", True, ["35","36","37","38","39","40","41","42","43","44","45","46","47","48"]),
                    ("brand", "Brand", "text", False, None),
                    ("colour", "Colour", "text", False, None),
                    ("condition", "Condition", "select", True, ["Brand New","UK Used","Nigerian Used"]),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("gender", "Gender", "multi_checkbox"),
                    ("size", "Size", "multi_checkbox"),
                    ("condition", "Condition", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Bags & Accessories", "bags-accessories",
                [
                    ("type", "Type", "select", True, ["Handbag","Backpack","Tote Bag","Clutch","Wallet","Belt","Watch","Sunglasses","Cap & Hat","Jewellery"]),
                    ("gender", "Gender", "select", False, ["Men","Women","Unisex"]),
                    ("brand", "Brand", "text", False, None),
                    ("condition", "Condition", "select", True, ["Brand New","UK Used","Nigerian Used"]),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("gender", "Gender", "multi_checkbox"),
                    ("condition", "Condition", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
        ]),
        ("Books & Stationery", "books", [
            ("Textbooks", "textbooks",
                [
                    ("subject", "Subject / Course", "text", True, None),
                    ("level", "Level", "select", True, ["100 Level","200 Level","300 Level","400 Level","500 Level","Postgraduate","Secondary School","Primary School"]),
                    ("department", "Department", "text", False, None),
                    ("author", "Author", "text", False, None),
                    ("edition", "Edition", "text", False, None),
                    ("condition", "Condition", "select", True, ["Brand New","Good Used","Fair Used"]),
                ],
                [
                    ("level", "Level", "multi_checkbox"),
                    ("condition", "Condition", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Fiction & Literature", "fiction",
                [
                    ("genre", "Genre", "select", True, ["African Literature","Romance","Thriller","Sci-Fi","Fantasy","Mystery","Biography","Self-Help","Business","Religion"]),
                    ("author", "Author", "text", False, None),
                    ("condition", "Condition", "select", True, ["Brand New","Good Used","Fair Used"]),
                ],
                [
                    ("genre", "Genre", "multi_checkbox"),
                    ("condition", "Condition", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Stationery & Office", "stationery",
                [
                    ("type", "Type", "select", True, ["Notebooks & Jotters","Pens & Markers","Printing Paper","Folders & Files","Art Supplies","Drawing Materials","Calculator"]),
                    ("brand", "Brand", "text", False, None),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
        ]),
        ("Beauty & Personal Care", "beauty", [
            ("Skincare", "skincare",
                [
                    ("type", "Product Type", "select", True, ["Moisturiser","Serum","Sunscreen","Toner","Face Wash","Body Lotion","Body Scrub","Soap","Spot Treatment"]),
                    ("skin_type", "Skin Type", "select", False, ["All Skin Types","Oily","Dry","Combination","Sensitive","Normal"]),
                    ("brand", "Brand", "text", False, None),
                    ("gender", "For", "select", False, ["All","Women","Men"]),
                ],
                [
                    ("type", "Product Type", "multi_checkbox"),
                    ("skin_type", "Skin Type", "multi_checkbox"),
                    ("gender", "For", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Hair Care", "haircare",
                [
                    ("type", "Product Type", "select", True, ["Shampoo","Conditioner","Hair Oil","Relaxer","Hair Cream","Edge Control","Wig","Weave","Hair Extension","Accessories"]),
                    ("hair_type", "Hair Type", "select", False, ["All Types","Natural Hair","Relaxed","Loc'd","4C"]),
                    ("brand", "Brand", "text", False, None),
                ],
                [
                    ("type", "Product Type", "multi_checkbox"),
                    ("hair_type", "Hair Type", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Makeup & Cosmetics", "makeup",
                [
                    ("type", "Type", "select", True, ["Foundation","Powder","Lipstick","Lip Gloss","Mascara","Eyeliner","Eyeshadow","Highlighter","Blush","Makeup Kit","Brushes & Tools"]),
                    ("brand", "Brand", "text", False, None),
                    ("shade", "Shade / Tone", "text", False, None),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Fragrances", "fragrances",
                [
                    ("type", "Type", "select", True, ["Perfume","Cologne","Body Spray","Attar / Oil Perfume","Roll-On"]),
                    ("gender", "For", "select", True, ["Men","Women","Unisex"]),
                    ("brand", "Brand", "text", False, None),
                    ("size_ml", "Size (ml)", "number", False, None),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("gender", "For", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
        ]),
        ("Home & Kitchen", "home-kitchen", [
            ("Kitchen Appliances", "kitchen-appliances",
                [
                    ("type", "Type", "select", True, ["Blender","Juicer","Microwave","Electric Cooker","Gas Cooker","Rice Cooker","Air Fryer","Toaster","Kettle","Food Processor","Refrigerator","Freezer"]),
                    ("brand", "Brand", "text", False, None),
                    ("condition", "Condition", "select", True, ["Brand New","UK Used","Nigerian Used"]),
                    ("power_watts", "Power (Watts)", "number", False, None),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("condition", "Condition", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Cookware & Utensils", "cookware",
                [
                    ("type", "Type", "select", True, ["Pots & Pans","Plates & Bowls","Cups & Mugs","Cutlery Set","Knife Set","Chopping Board","Storage Containers","Serving Dishes"]),
                    ("material", "Material", "select", False, ["Stainless Steel","Non-Stick","Aluminium","Ceramic","Plastic","Glass","Cast Iron"]),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("material", "Material", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Furniture", "furniture",
                [
                    ("type", "Type", "select", True, ["Bed Frame","Mattress","Sofa","Dining Table","Study Table","Wardrobe","Bookshelf","Office Chair","Study Chair"]),
                    ("material", "Material", "select", False, ["Wood","Metal","Plastic","Fabric","Leather"]),
                    ("condition", "Condition", "select", True, ["Brand New","Nigerian Used"]),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("condition", "Condition", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
        ]),
        ("Health & Fitness", "health-fitness", [
            ("Vitamins & Supplements", "supplements",
                [
                    ("type", "Type", "select", True, ["Multivitamin","Vitamin C","Vitamin D","Iron","Zinc","Omega-3","Protein Powder","Pre-Workout","Immune Booster","Weight Gain","Weight Loss"]),
                    ("brand", "Brand", "text", False, None),
                    ("form", "Form", "select", False, ["Tablets","Capsules","Powder","Liquid","Gummies"]),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("form", "Form", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Fitness Equipment", "fitness-equipment",
                [
                    ("type", "Type", "select", True, ["Dumbbells","Resistance Bands","Yoga Mat","Jump Rope","Pull-Up Bar","Treadmill","Stationary Bike","Kettlebell"]),
                    ("condition", "Condition", "select", True, ["Brand New","Nigerian Used"]),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("condition", "Condition", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
        ]),
        ("Phones & Accessories", "phone-accessories", [
            ("Phone Cases & Covers", "phone-cases",
                [
                    ("compatible_model", "Compatible Model", "text", True, None),
                    ("type", "Case Type", "select", True, ["Back Cover","Flip Case","Wallet Case","Bumper Case","Clear Case","Rugged Case"]),
                    ("material", "Material", "select", False, ["Silicone","Leather","Hard Plastic","TPU","Rubber"]),
                ],
                [
                    ("type", "Case Type", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Chargers & Cables", "chargers",
                [
                    ("type", "Type", "select", True, ["USB-C Cable","Lightning Cable","Micro-USB Cable","Fast Charger","Wireless Charger","Power Bank","Multi-Port Charger"]),
                    ("wattage", "Wattage", "select", False, ["5W","10W","18W","25W","45W","65W","100W"]),
                    ("brand", "Brand", "text", False, None),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
        ]),
    ]),
    # ===================================================================
    # FOODS
    # ===================================================================
    (foods_id, "foods", [
        ("Nigerian Dishes", "nigerian-dishes", [
            ("Rice Dishes", "rice-dishes",
                [
                    ("dish_name", "Dish Name", "select", True, ["Jollof Rice","Fried Rice","White Rice & Stew","Coconut Rice","Ofada Rice","Tuwo & Soup"]),
                    ("protein", "Protein Choice", "multi_select", True, ["Chicken","Beef","Turkey","Fish","Ponmo","Gizzard","Tofu (Vegan)","None"]),
                    ("portion_size", "Portion Size", "select", True, ["Small","Medium","Large","Jumbo","Family Pack"]),
                    ("extras", "Extras", "multi_select", False, ["Salad","Coleslaw","Plantain","Moi Moi","Egg","Peppered Sauce"]),
                    ("spice_level", "Spice Level", "select", False, ["Mild","Medium","Hot","Extra Hot"]),
                    ("dietary", "Dietary", "multi_select", False, ["Halal","Vegan","Gluten-Free"]),
                ],
                [
                    ("dish_name", "Dish", "multi_checkbox"),
                    ("protein", "Protein", "multi_checkbox"),
                    ("portion_size", "Portion", "multi_checkbox"),
                    ("dietary", "Dietary", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Soups & Swallows", "soups-swallows",
                [
                    ("soup_type", "Soup", "select", True, ["Egusi Soup","Okra Soup","Oha Soup","Ogbono Soup","Banga Soup","Afang Soup","Edikaikong","Pepper Soup","Vegetable Soup"]),
                    ("swallow", "Swallow", "select", True, ["Pounded Yam","Fufu","Eba (Garri)","Amala","Semo","Wheat","None (Soup Only)"]),
                    ("protein", "Protein", "multi_select", True, ["Beef","Assorted Meat","Fish","Stockfish","Snail","Chicken","Ponmo","None"]),
                    ("portion_size", "Portion Size", "select", True, ["Small","Medium","Large","Family Pack"]),
                    ("dietary", "Dietary", "multi_select", False, ["Halal","Vegan","Gluten-Free"]),
                ],
                [
                    ("soup_type", "Soup Type", "multi_checkbox"),
                    ("swallow", "Swallow", "multi_checkbox"),
                    ("protein", "Protein", "multi_checkbox"),
                    ("dietary", "Dietary", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Yam & Plantain", "yam-plantain",
                [
                    ("dish_name", "Dish", "select", True, ["Boiled Yam & Egg Sauce","Yam Porridge","Fried Yam","Roasted Yam","Fried Plantain (Dodo)","Plantain Porridge","Boli & Groundnut","Puff Puff"]),
                    ("accompaniment", "Served With", "multi_select", False, ["Egg Sauce","Fish Stew","Pepper Sauce","Groundnut","Beans"]),
                    ("portion_size", "Portion Size", "select", True, ["Small","Medium","Large"]),
                ],
                [
                    ("dish_name", "Dish", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Beans & Porridge", "beans",
                [
                    ("dish_name", "Dish", "select", True, ["Beans & Plantain","Moi Moi","Akara","Beans Porridge","Gbegiri Soup","Adalu (Beans & Corn)"]),
                    ("protein", "Protein", "multi_select", False, ["Egg","Fish","None"]),
                    ("portion_size", "Portion Size", "select", True, ["Small","Medium","Large"]),
                ],
                [
                    ("dish_name", "Dish", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
        ]),
        ("Grills & BBQ", "grills-bbq", [
            ("Suya & Kebab", "suya",
                [
                    ("type", "Type", "select", True, ["Beef Suya","Chicken Suya","Gizzard Suya","Ram Suya","Fish Suya","Asun (Peppered Goat)","Kebab"]),
                    ("quantity", "Quantity", "select", True, ["1 Stick","3 Sticks","5 Sticks","10 Sticks","Half Wrap","Full Wrap","1kg","2kg"]),
                    ("spice_level", "Spice Level", "select", False, ["Mild","Medium","Hot","Extra Hot"]),
                    ("accompaniment", "With", "multi_select", False, ["Sliced Onions","Tomato","Cucumber","Cabin Biscuit"]),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("spice_level", "Spice Level", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Peppered Snacks", "peppered-snacks",
                [
                    ("type", "Type", "select", True, ["Peppered Chicken","Peppered Turkey","Peppered Gizzard","Peppered Fish","Peppered Ponmo","Peppered Snail"]),
                    ("portion_size", "Portion Size", "select", True, ["Small","Medium","Large","Party Pack"]),
                    ("spice_level", "Spice Level", "select", False, ["Mild","Medium","Hot","Extra Hot"]),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
        ]),
        ("Fast Food & Snacks", "fast-food", [
            ("Burgers & Sandwiches", "burgers",
                [
                    ("type", "Type", "select", True, ["Beef Burger","Chicken Burger","Fish Burger","Veggie Burger","Club Sandwich","Shawarma"]),
                    ("size", "Size", "select", True, ["Regular","Large","Double","Meal Deal (+ Fries & Drink)"]),
                    ("extras", "Add-ons", "multi_select", False, ["Extra Cheese","Extra Sauce","Jalapeños","Bacon","Egg"]),
                    ("dietary", "Dietary", "multi_select", False, ["Halal","Vegetarian"]),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("dietary", "Dietary", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Pastries & Pies", "pastries",
                [
                    ("type", "Type", "select", True, ["Meat Pie","Fish Roll","Spring Roll","Samosa","Sausage Roll","Egg Roll","Puff Puff","Doughnut","Chin Chin","Scotch Egg"]),
                    ("quantity", "Quantity", "select", True, ["1 Piece","3 Pieces","5 Pieces","10 Pieces","Per Bag"]),
                    ("dietary", "Dietary", "multi_select", False, ["Halal","Vegetarian"]),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Pizza & Chips", "pizza-chips",
                [
                    ("type", "Type", "select", True, ["Pizza","Loaded Fries","Waffle Fries","Potato Chips"]),
                    ("size", "Size", "select", False, ["Small","Medium","Large","Family"]),
                    ("toppings", "Toppings / Flavour", "multi_select", False, ["Chicken","Pepperoni","Beef","Veggie","Extra Cheese","BBQ"]),
                    ("dietary", "Dietary", "multi_select", False, ["Halal","Vegetarian"]),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("dietary", "Dietary", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
        ]),
        ("Drinks & Beverages", "drinks", [
            ("Cold Drinks", "cold-drinks",
                [
                    ("type", "Type", "select", True, ["Zobo","Kunu","Fura da Nono","Chapman","Bottled Water","Soft Drink","Energy Drink","Juice","Smoothie","Chilled Coconut Water"]),
                    ("size", "Size / Volume", "select", True, ["Small (330ml)","Medium (500ml)","Large (1L)","Bottle (75cl)","Per Cup"]),
                    ("dietary", "Dietary", "multi_select", False, ["Sugar-Free","Vegan","No Artificial Colour"]),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Hot Beverages", "hot-beverages",
                [
                    ("type", "Type", "select", True, ["Tea","Coffee","Milo & Milk","Bournvita & Milk","Hot Chocolate","Ginger & Lemon Tea"]),
                    ("size", "Cup Size", "select", True, ["Small","Medium","Large","Flask"]),
                    ("milk_option", "Milk", "select", False, ["With Milk","Without Milk","Oat Milk","Soy Milk"]),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
        ]),
        ("Groceries & Raw Food", "groceries", [
            ("Foodstuffs", "foodstuffs",
                [
                    ("type", "Type", "select", True, ["Rice (per kg)","Garri (per kg)","Beans (per kg)","Yam (per tuber)","Plantain (per hand)","Palm Oil (per litre)","Groundnut Oil","Tomato Paste","Crayfish","Stockfish","Pepper (Blended)","Onions"]),
                    ("quantity_unit", "Unit", "select", True, ["Per kg","Per litre","Per piece","Per pack","Per bag (50kg)"]),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Packaged Goods", "packaged-goods",
                [
                    ("type", "Type", "select", True, ["Noodles","Pasta","Canned Tomatoes","Sardines","Margarine","Biscuits","Cereal","Sugar","Salt","Seasoning Cubes"]),
                    ("brand", "Brand", "text", False, None),
                    ("quantity", "Quantity", "text", False, None),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
        ]),
        ("Desserts & Sweets", "desserts", [
            ("Cakes & Confections", "cakes",
                [
                    ("type", "Type", "select", True, ["Birthday Cake","Celebration Cake","Cupcakes","Cheesecake","Carrot Cake","Chocolate Cake","Vanilla Cake","Red Velvet"]),
                    ("size", "Size", "select", True, ["Small (6 inch)","Medium (8 inch)","Large (10 inch)","Tiered","Per Slice","Per Dozen (Cupcakes)"]),
                    ("flavour", "Flavour", "text", False, None),
                    ("inscription", "Inscription", "text", False, None),
                    ("dietary", "Dietary", "multi_select", False, ["Eggless","Gluten-Free","Sugar-Free","Vegan"]),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("dietary", "Dietary", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Ice Cream & Parfaits", "ice-cream",
                [
                    ("type", "Type", "select", True, ["Ice Cream (Cup)","Ice Cream (Cone)","Milkshake","Parfait","Yoghurt Parfait","Fruit Salad"]),
                    ("flavour", "Flavour", "multi_select", False, ["Chocolate","Vanilla","Strawberry","Cookies & Cream","Caramel","Mango","Mixed Fruit"]),
                    ("size", "Size", "select", True, ["Small","Medium","Large"]),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
        ]),
    ]),
    # ===================================================================
    # SERVICES
    # ===================================================================
    (services_id, "services", [
        ("Academic & Tutoring", "academic", [
            ("Private Tutoring", "tutoring",
                [
                    ("subject", "Subject(s)", "multi_select", True, ["Mathematics","Physics","Chemistry","Biology","English","Literature","Economics","Accounting","Government","History","Geography","Computer Science","French","Yoruba","Igbo","Hausa"]),
                    ("level", "Level", "select", True, ["Primary School","Junior Secondary (JSS)","Senior Secondary (WAEC/NECO)","University (100L-200L)","University (300L-500L)","JAMB Prep","Post-UTME Prep","GCE Prep"]),
                    ("mode", "Mode", "select", True, ["In-Person (at student location)","In-Person (at my location)","Online (Zoom / Google Meet)","Hybrid"]),
                    ("session_duration", "Session Duration", "select", True, ["1 Hour","1.5 Hours","2 Hours","3 Hours"]),
                    ("frequency", "Frequency", "select", False, ["Once-Off","2x per week","3x per week","Daily","Weekends Only"]),
                    ("qualification", "My Qualification", "text", False, None),
                ],
                [
                    ("subject", "Subject", "multi_checkbox"),
                    ("level", "Level", "multi_checkbox"),
                    ("mode", "Mode", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Assignment & Research Help", "assignment-help",
                [
                    ("type", "Type", "select", True, ["Assignment Help","Research Paper","Literature Review","Data Analysis","Seminar Paper","Thesis Writing","Proofreading & Editing","PowerPoint Presentation"]),
                    ("subject", "Subject / Course", "text", True, None),
                    ("level", "Academic Level", "select", True, ["Undergraduate","Postgraduate (MSc)","Postgraduate (PhD)","Secondary School"]),
                    ("delivery_days", "Delivery (Days)", "select", True, ["Same Day","1 Day","2-3 Days","1 Week","To Be Agreed"]),
                    ("word_count", "Approx. Word Count", "select", False, ["Under 1,000","1,000-3,000","3,000-5,000","5,000-10,000","10,000+"]),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("level", "Level", "multi_checkbox"),
                    ("delivery_days", "Delivery Time", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Tech Skills Training", "tech-training",
                [
                    ("skill", "Skill", "select", True, ["Web Development (HTML/CSS/JS)","Web Development (React)","Python Programming","Data Analysis","Graphic Design (Canva)","Graphic Design (Photoshop/Illustrator)","Video Editing","Mobile App Development","Cybersecurity Basics","Microsoft Excel","Digital Marketing","UI/UX Design"]),
                    ("level", "Learner Level", "select", True, ["Complete Beginner","Intermediate","Advanced"]),
                    ("mode", "Mode", "select", True, ["In-Person","Online","Hybrid"]),
                    ("duration", "Course Duration", "select", True, ["1 Day Workshop","1 Week","2 Weeks","1 Month","3 Months","Per Session"]),
                ],
                [
                    ("skill", "Skill", "multi_checkbox"),
                    ("mode", "Mode", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
        ]),
        ("Beauty & Grooming", "beauty-services", [
            ("Hair Styling", "hair-styling",
                [
                    ("service", "Service", "select", True, ["Braiding","Cornrows","Locs / Dreadlocks","Weave Installation","Wig Making","Wig Styling","Hair Relaxing","Colouring","Natural Hair Styling","Blowout","Hair Washing & Treatment"]),
                    ("gender", "For", "select", True, ["Women","Men","Children"]),
                    ("location", "Service Location", "select", True, ["At my salon","At client location (home service)"]),
                    ("duration_estimate", "Estimated Duration", "select", False, ["Under 1 Hour","1-2 Hours","2-4 Hours","4+ Hours"]),
                ],
                [
                    ("service", "Service", "multi_checkbox"),
                    ("gender", "For", "multi_checkbox"),
                    ("location", "Location", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Makeup & Glam", "makeup-services",
                [
                    ("service", "Service", "select", True, ["Full Glam Makeup","Natural / No-Makeup Makeup","Bridal Makeup","Party Makeup","Aso-Ebi Makeup","Eyebrow Shaping & Threading","Eyelash Extension","Body Paint / SFX"]),
                    ("location", "Service Location", "select", True, ["At my studio","At client location"]),
                    ("duration_estimate", "Estimated Duration", "select", False, ["30-45 Mins","1 Hour","1.5-2 Hours","2+ Hours"]),
                    ("kit_type", "Kit Used", "select", False, ["Professional Kit (MAC, Charlotte Tilbury, etc.)","Mixed Kit","Client Products"]),
                ],
                [
                    ("service", "Service", "multi_checkbox"),
                    ("location", "Location", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Barbing", "barbing",
                [
                    ("service", "Service", "select", True, ["Haircut (General)","Low Cut","Fade","Dreads Retouch","Beard Trim & Shape","Shave","Hair Design (Pattern)","Hot Towel Shave"]),
                    ("location", "Location", "select", True, ["At my barbershop","Home service (at client location)"]),
                    ("extras", "Extras", "multi_select", False, ["Beard Dyeing","Hair Dyeing","Scalp Treatment"]),
                ],
                [
                    ("service", "Service", "multi_checkbox"),
                    ("location", "Location", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Nail & Spa", "nail-spa",
                [
                    ("service", "Service", "select", True, ["Manicure","Pedicure","Gel Nails","Acrylic Nails","Nail Extensions","Nail Art","Full Body Massage","Back Massage","Facial Treatment","Waxing"]),
                    ("location", "Location", "select", True, ["At my salon/spa","Home service"]),
                    ("duration_estimate", "Duration", "select", False, ["Under 30 Mins","30-60 Mins","1-2 Hours","2+ Hours"]),
                ],
                [
                    ("service", "Service", "multi_checkbox"),
                    ("location", "Location", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
        ]),
        ("Creative & Digital", "creative-digital", [
            ("Graphic Design", "graphic-design",
                [
                    ("service", "Service", "select", True, ["Logo Design","Flyer / Poster Design","Banner Design","Business Card Design","Social Media Graphics","Brand Identity Package","Invitation Card","T-Shirt Design","Packaging Design","CV / Resume Design"]),
                    ("delivery_format", "Delivery Format", "multi_select", True, ["PDF","PNG","JPEG","SVG","PSD Source File","AI Source File"]),
                    ("revisions", "Revisions Included", "select", True, ["0","1","2","3","Unlimited"]),
                    ("delivery_days", "Delivery (Days)", "select", True, ["Same Day","1 Day","2-3 Days","1 Week"]),
                ],
                [
                    ("service", "Service", "multi_checkbox"),
                    ("delivery_days", "Delivery Time", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Video Editing", "video-editing",
                [
                    ("service", "Service", "select", True, ["Short Video Edit (Reels / TikTok)","YouTube Video Edit","Wedding / Event Highlights","Corporate Video","Motion Graphics","Podcast Editing","Colour Grading"]),
                    ("duration_of_video", "Video Duration", "select", True, ["Under 1 Min","1-5 Mins","5-15 Mins","15-30 Mins","30+ Mins"]),
                    ("delivery_format", "Output Format", "multi_select", False, ["MP4 (1080p)","MP4 (4K)","MOV","AVI"]),
                    ("delivery_days", "Delivery (Days)", "select", True, ["Same Day","1 Day","2-3 Days","1 Week","2 Weeks"]),
                ],
                [
                    ("service", "Service", "multi_checkbox"),
                    ("delivery_days", "Delivery Time", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Photography", "photography",
                [
                    ("service", "Service", "select", True, ["Portrait Session","Product Photography","Event Coverage","Graduation Photos","Couple Session","Content Creation Shoot","Passport Photos","Food Photography"]),
                    ("location", "Shoot Location", "select", True, ["My Studio","Client Location","Outdoor (agreed location)","Studio Hire Included"]),
                    ("photos_delivered", "Photos Delivered", "select", True, ["5-10","10-20","20-50","50-100","100+","All Raw + Edited"]),
                    ("duration", "Session Duration", "select", True, ["30 Mins","1 Hour","2 Hours","Half Day","Full Day"]),
                    ("editing_included", "Editing Included?", "boolean", True, None),
                ],
                [
                    ("service", "Service", "multi_checkbox"),
                    ("location", "Location", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Writing & Content", "writing-content",
                [
                    ("service", "Service", "select", True, ["Blog Post / Article","Copywriting","Social Media Captions","SEO Content","Product Description","Email Newsletter","Speech Writing","Proofreading","Translation (English to Yoruba/Igbo/Hausa)"]),
                    ("word_count", "Approx. Word Count", "select", False, ["Under 500","500-1,000","1,000-2,000","2,000-5,000","5,000+"]),
                    ("delivery_days", "Delivery (Days)", "select", True, ["Same Day","1 Day","2-3 Days","1 Week"]),
                    ("revisions", "Revisions", "select", True, ["0","1","2","3","Unlimited"]),
                ],
                [
                    ("service", "Service", "multi_checkbox"),
                    ("delivery_days", "Delivery Time", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
        ]),
        ("Home & Repairs", "home-repairs", [
            ("Electrical Works", "electrical",
                [
                    ("service", "Service", "select", True, ["Bulb / Light Fitting","Socket & Switch Installation","Fan Installation / Repair","AC Installation / Repair","Generator Repair","Inverter Setup","Full House Wiring","Electrical Fault Diagnosis"]),
                    ("urgency", "Urgency", "select", True, ["Emergency (same day)","Within 24 Hours","Within 3 Days","Flexible"]),
                    ("service_area", "Service Area", "text", True, None),
                ],
                [
                    ("service", "Service", "multi_checkbox"),
                    ("urgency", "Urgency", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Plumbing", "plumbing",
                [
                    ("service", "Service", "select", True, ["Tap / Faucet Repair","Pipe Fixing / Leak Repair","Toilet Installation / Repair","Water Tank Connection","Bathroom Fitting","Drainage Unblocking","Borehole Maintenance"]),
                    ("urgency", "Urgency", "select", True, ["Emergency (same day)","Within 24 Hours","Within 3 Days","Flexible"]),
                ],
                [
                    ("service", "Service", "multi_checkbox"),
                    ("urgency", "Urgency", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Cleaning Services", "cleaning",
                [
                    ("service", "Service", "select", True, ["Room Cleaning","Apartment / Flat Cleaning","Post-Construction Cleaning","Office Cleaning","Carpet / Rug Cleaning","Upholstery Cleaning","Laundry & Ironing","Deep Cleaning"]),
                    ("property_type", "Property Type", "select", True, ["Self-Con","1-Bedroom","2-Bedroom","3-Bedroom","4-Bedroom+","Office Space","Hostel Room"]),
                    ("frequency", "Frequency", "select", False, ["Once-Off","Weekly","Bi-Weekly","Monthly"]),
                ],
                [
                    ("service", "Service", "multi_checkbox"),
                    ("frequency", "Frequency", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Gadget Repairs", "gadget-repairs",
                [
                    ("device", "Device", "select", True, ["Smartphone","Laptop","Tablet","Television","Printer","Generator","Fan","Washing Machine","Air Conditioner"]),
                    ("issue", "Issue", "select", True, ["Screen Replacement","Battery Replacement","Charging Port Repair","Software / OS Issue","Speaker / Microphone","Keyboard / Touchpad","Water Damage","General Diagnosis","Other"]),
                    ("urgency", "Urgency", "select", True, ["Emergency (same day)","Within 24 Hours","Within 3 Days","Flexible"]),
                    ("pickup_drop", "Pickup / Drop-off", "select", True, ["I bring device to you","You come to pick up","Remote Fix (software only)"]),
                ],
                [
                    ("device", "Device", "multi_checkbox"),
                    ("urgency", "Urgency", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
        ]),
        ("Logistics & Errands", "logistics-errands", [
            ("Dispatch & Delivery", "dispatch",
                [
                    ("type", "Type", "select", True, ["Document Delivery","Package Delivery","Grocery Run","Campus Errand","Airport / Park Pickup"]),
                    ("vehicle", "Vehicle", "select", True, ["Motorcycle (Okada)","Tricycle (Keke)","Car","Van / Truck"]),
                    ("distance", "Distance", "select", True, ["Within Campus","Within Same LGA","Cross LGA","Cross State"]),
                ],
                [
                    ("type", "Type", "multi_checkbox"),
                    ("vehicle", "Vehicle", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Printing & Photocopying", "printing",
                [
                    ("service", "Service", "select", True, ["Black & White Printing","Colour Printing","Binding (Spiral)","Binding (Hard Cover)","Lamination","Scanning","Photocopying","Large Format Printing"]),
                    ("paper_size", "Paper Size", "select", False, ["A4","A3","A5","Legal","Custom"]),
                    ("quantity", "Quantity", "text", False, None),
                    ("delivery", "Delivery Method", "select", True, ["Pick up at location","Home / Office Delivery"]),
                ],
                [
                    ("service", "Service", "multi_checkbox"),
                    ("delivery", "Delivery", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
        ]),
        ("Events & Entertainment", "events-entertainment", [
            ("Event Planning & Decoration", "event-planning",
                [
                    ("service", "Service", "select", True, ["Full Event Planning","Decoration Only","Table Setting & Styling","MC / Host","Birthday Planning","Wedding Planning","Conference / Seminar Planning"]),
                    ("event_size", "Event Size", "select", True, ["Small (under 50)","Medium (50-150)","Large (150-500)","Very Large (500+)"]),
                    ("location_type", "Venue Type", "select", False, ["Indoor","Outdoor","Virtual","Hybrid"]),
                ],
                [
                    ("service", "Service", "multi_checkbox"),
                    ("event_size", "Event Size", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
            ("Music & DJ", "music-dj",
                [
                    ("service", "Service", "select", True, ["DJ Services","Live Band","Solo Artist Performance","Beat Production","Music Recording","Voiceover"]),
                    ("duration", "Duration", "select", True, ["1 Hour","2 Hours","3 Hours","4+ Hours","Full Night"]),
                    ("genre", "Genre / Style", "multi_select", False, ["Afrobeats","Amapiano","Hip-Hop","R&B","Gospel","Fuji","Highlife","EDM","All Genres"]),
                ],
                [
                    ("service", "Service", "multi_checkbox"),
                    ("price_range", "Price Range (₦)", "range_slider"),
                ]
            ),
        ]),
    ]),
]

# --------------------------------------------------------------------
# SQL GENERATION
# --------------------------------------------------------------------
def generate_sql():
    lines = []
    lines.append("-- ============================================================")
    lines.append("-- OMEKART FULL TAXONOMY SEED (with all production columns)")
    lines.append("-- Run this once in Supabase SQL Editor")
    lines.append("-- Order: taxonomy_nodes → category_attribute_definitions → filter_blueprints")
    lines.append("-- ============================================================")
    lines.append("")

    # ----- LEVEL 1: VERTICAL ROOTS -----
    lines.append("-- LEVEL 1: VERTICAL ROOTS")
    lines.append("INSERT INTO taxonomy_nodes (")
    lines.append("    id, name, slug, vertical, level, sort_order,")
    lines.append("    icon_url, fallback_icon_url, banner_url, is_active, min_images, max_images")
    lines.append(") VALUES")
    lines.append(f"    ('{products_id}', 'Products', 'products', 'products', 1, 1, NULL, NULL, NULL, TRUE, 1, 10),")
    lines.append(f"    ('{foods_id}', 'Foods', 'foods', 'foods', 1, 2, NULL, NULL, NULL, TRUE, 1, 10),")
    lines.append(f"    ('{services_id}', 'Services', 'services', 'services', 1, 3, NULL, NULL, NULL, TRUE, 1, 10)")
    lines.append("ON CONFLICT (vertical, slug) DO NOTHING;")
    lines.append("")

    cat_rows = []
    subcat_rows = []
    attr_rows = []
    filter_rows = []

    for vertical_id, vertical_slug, categories in TAXONOMY:
        for cat_sort, (cat_name, cat_slug, subcategories) in enumerate(categories, start=1):
            cat_id = uid()
            cat_rows.append(
                f"    ('{cat_id}', '{q(cat_name)}', '{q(cat_slug)}', "
                f"'{vertical_id}', '{vertical_slug}', 2, {cat_sort}, "
                f"NULL, NULL, NULL, TRUE, 1, 10)"
            )
            for sub_sort, subcat_data in enumerate(subcategories, start=1):
                sub_name, sub_slug, attrs, filters = subcat_data
                sub_id = uid()
                subcat_rows.append(
                    f"    ('{sub_id}', '{q(sub_name)}', '{q(sub_slug)}', "
                    f"'{cat_id}', '{vertical_slug}', 3, {sub_sort}, "
                    f"NULL, NULL, NULL, TRUE, 1, 10)"
                )

                # Attributes
                for a_sort, (a_key, a_label, a_type, a_req, a_opt) in enumerate(attrs, start=1):
                    opts_sql = "NULL" if a_opt is None else f"'{json.dumps(a_opt)}'"
                    req_sql = "true" if a_req else "false"
                    attr_rows.append(
                        f"    ('{uid()}', '{sub_id}', '{q(a_key)}', '{q(a_label)}', "
                        f"'{a_type}', {req_sql}, {opts_sql}, {a_sort}, "
                        f"0, false, true, true)"  # search_weight, show_in_card, show_in_search, show_in_listing
                    )

                # Filters
                for f_sort, (f_key, f_label, f_ui) in enumerate(filters, start=1):
                    filter_rows.append(
                        f"    ('{uid()}', '{sub_id}', '{q(f_key)}', '{q(f_label)}', "
                        f"'{f_ui}', {f_sort})"
                    )

    # ----- LEVEL 2: CATEGORIES -----
    lines.append("-- LEVEL 2: CATEGORIES")
    lines.append("INSERT INTO taxonomy_nodes (")
    lines.append("    id, name, slug, parent_id, vertical, level, sort_order,")
    lines.append("    icon_url, fallback_icon_url, banner_url, is_active, min_images, max_images")
    lines.append(") VALUES")
    lines.append(",\n".join(cat_rows))
    lines.append("ON CONFLICT (vertical, slug) DO NOTHING;")
    lines.append("")

    # ----- LEVEL 3: SUBCATEGORIES -----
    lines.append("-- LEVEL 3: SUBCATEGORIES")
    lines.append("INSERT INTO taxonomy_nodes (")
    lines.append("    id, name, slug, parent_id, vertical, level, sort_order,")
    lines.append("    icon_url, fallback_icon_url, banner_url, is_active, min_images, max_images")
    lines.append(") VALUES")
    lines.append(",\n".join(subcat_rows))
    lines.append("ON CONFLICT (vertical, slug) DO NOTHING;")
    lines.append("")

    # ----- ATTRIBUTE DEFINITIONS -----
    lines.append("-- ATTRIBUTE DEFINITIONS")
    lines.append("INSERT INTO category_attribute_definitions (")
    lines.append("    id, node_id, attribute_key, attribute_label, attribute_type, required, options, sort_order,")
    lines.append("    search_weight, show_in_card, show_in_search, show_in_listing")
    lines.append(") VALUES")
    lines.append(",\n".join(attr_rows))
    lines.append("ON CONFLICT (id) DO NOTHING;")
    lines.append("")

    # ----- FILTER BLUEPRINTS -----
    lines.append("-- FILTER BLUEPRINTS")
    lines.append("INSERT INTO filter_blueprints (")
    lines.append("    id, node_id, control_key, control_label, ui_control, sort_order")
    lines.append(") VALUES")
    lines.append(",\n".join(filter_rows))
    lines.append("ON CONFLICT (id) DO NOTHING;")
    lines.append("")

    # ----- STATISTICS -----
    lines.append("-- ============================================================")
    lines.append("-- SEED COMPLETE")
    lines.append("-- ============================================================")
    lines.append(f"-- Total vertical roots: 3")
    lines.append(f"-- Total categories: {len(cat_rows)}")
    lines.append(f"-- Total subcategories: {len(subcat_rows)}")
    lines.append(f"-- Total attribute definitions: {len(attr_rows)}")
    lines.append(f"-- Total filter blueprints: {len(filter_rows)}")
    lines.append("--")

    return "\n".join(lines)

if __name__ == "__main__":
    sql = generate_sql()
    output_file = "omekart_taxonomy_seed.sql"   # saves in the same folder
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(sql)
    print(f" SQL seed file generated: {output_file}")
    print(f"   - Categories: {sql.count('INSERT INTO taxonomy_nodes') - 1} (excluding verticals)")
    print(f"   - Attributes: {sql.count('INSERT INTO category_attribute_definitions')}")
    print(f"   - Filters: {sql.count('INSERT INTO filter_blueprints')}")