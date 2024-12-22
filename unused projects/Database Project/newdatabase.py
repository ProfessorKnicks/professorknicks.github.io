import mysql.connector
from tabulate import tabulate
from datetime import datetime


def open_database(hostname, user_name, mysql_pw, database_name):
    global conn
    conn = mysql.connector.connect(host=hostname,
                                   user=user_name,
                                   password=mysql_pw,
                                   database=database_name
                                   )
    global cursor
    cursor = conn.cursor()


def printFormat(result):
    header = []
    for cd in cursor.description:  # get headers
        header.append(cd[0])
    print('')
    print('Query Result:')
    print('')
    print(tabulate(result, headers=header))  # print results in table format

# select and display query


def executeSelect(query):
    cursor.execute(query)
    result = cursor.fetchall()
    if not result:
        print("No entries found.")
    else:
        printFormat(result)


def insert(table, values):
    query = "INSERT into " + table + " values (" + values + ")" + ';'
    cursor.execute(query)
    conn.commit()


def executeUpdate(query):  # use this function for delete and update
    cursor.execute(query)
    conn.commit()


def close_db():  # use this function to close db
    cursor.close()
    conn.close()

def find_menu_items():
    restaurant_name = input("Enter the restaurant name: ")
    city = input("Enter the city: ")
    query = f"SELECT D.dishName, MI.price FROM Dish AS D JOIN MenuItem AS MI ON D.dishNo = MI.dishNo JOIN Restaurant AS R ON MI.restaurantNo = R.restaurantID WHERE R.restaurantName = '{restaurant_name}' AND R.city = '{city}'"
    executeSelect(query)

def order_menu_item():
    dish_name = input("Enter the dish name you want to order: ")
    query = f"SELECT m.itemNo, r.restaurantName, r.city, m.price FROM MenuItem m JOIN Restaurant r ON m.restaurantNo = r.restaurantID WHERE m.dishNo = (SELECT dishNo FROM Dish WHERE dishName = '{dish_name}')"
    executeSelect(query)

    cursor.execute(query)
    result = cursor.fetchall()

    if not result:
        print(" ")
    else:
        item_no = input("Enter the item number you want to order: ")
        current_time = datetime.now().strftime("%H:%M:%S")
        current_date = datetime.now().strftime("%Y-%m-%d")
        
        # Fetch the maximum order number from the FoodOrder table
        cursor.execute("SELECT MAX(orderNo) FROM FoodOrder")
        max_order_no = cursor.fetchone()[0]
        order_no = max_order_no + 1 if max_order_no is not None else 1  # Increment the order number
        
        insert_query = f"INSERT INTO FoodOrder (orderNo, itemNo, date, time) VALUES ({order_no}, {item_no}, '{current_date}', '{current_time}')"
        executeUpdate(insert_query)  
        print("Order placed successfully!")

def list_food_orders():
    restaurant_name = input("Enter the restaurant name: ")
    city = input("Enter the city: ")
    query = f"""
            SELECT d.dishName, mi.price, fo.date, fo.time
            FROM FoodOrder fo
            JOIN MenuItem mi ON fo.itemNo = mi.itemNo 
            JOIN Dish d ON mi.dishNo = d.dishNo 
            JOIN Restaurant r ON mi.restaurantNo = r.restaurantID
            WHERE r.restaurantName = '{restaurant_name}' AND r.city = '{city}';
            """
    print("Restaurant:", restaurant_name)
    executeSelect(query)

def cancel_food_order():
    # Display all food orders
    query = "SELECT * FROM FoodOrder"
    executeSelect(query)
    # Ask for order number to cancel
    order_no = input("Enter the order number you want to cancel: ")
    # Execute the delete query
    delete_query = f"DELETE FROM FoodOrder WHERE orderNo = {order_no}"
    executeUpdate(delete_query)  # Corrected the function name from executeQuery to executeUpdate

    print("Order canceled successfully!")

def add_new_dish():
    restaurant_name = input("Enter the restaurant name: ")
    city = input("Enter the city: ")

    query = f"""
            SELECT D.dishNo, D.dishName, MI.price 
            FROM Dish AS D 
            JOIN MenuItem AS MI ON D.dishNo = MI.dishNo 
            JOIN Restaurant AS R ON MI.restaurantNo = R.restaurantID 
            WHERE R.restaurantName = '{restaurant_name}' AND R.city = '{city}'
            """
    executeSelect(query)
    print(" ")
    
    # Input details for the new dish
    dish_name = input("Enter the dish name: ")
    dish_type = input("Enter the dish type: ")
    price = float(input("Enter the price: "))
    
    try:
        # Fetch the maximum dishNo from the Dish table
        cursor.execute("SELECT MAX(dishNo) FROM Dish")
        max_dish_no = cursor.fetchone()[0]
        if max_dish_no is None:
            max_dish_no = 0  # If there are no dishes in the table yet, set max_dish_no to 0
        new_dish_no = max_dish_no + 1
        
        # Fetch the maximum itemNo from the MenuItem table
        cursor.execute("SELECT MAX(itemNo) FROM MenuItem")
        max_item_no = cursor.fetchone()[0]
        if max_item_no is None:
            max_item_no = 0  # If there are no items in the table yet, set max_item_no to 0
        new_item_no = max_item_no + 1
        
        # Insert new dish into the Dish table
        insert_dish_query = "INSERT INTO Dish (dishNo, dishName, type) VALUES (%s, %s, %s)"
        dish_data = (new_dish_no, dish_name, dish_type)
        cursor.execute(insert_dish_query, dish_data)
        
        # Insert new menu item into the MenuItem table
        insert_menu_item_query = "INSERT INTO MenuItem (itemNo, restaurantNo, dishNo, price) VALUES (%s, (SELECT restaurantID FROM Restaurant WHERE restaurantName = %s AND city = %s), %s, %s)"
        menu_item_data = (new_item_no, restaurant_name, city, new_dish_no, price)
        cursor.execute(insert_menu_item_query, menu_item_data)
        
        # Commit the transaction
        conn.commit()
        
        print("New dish added successfully!")
        
        # Display the updated menu
        updated_query = f"""
            SELECT D.dishNo, D.dishName, MI.price 
            FROM Dish AS D 
            JOIN MenuItem AS MI ON D.dishNo = MI.dishNo 
            JOIN Restaurant AS R ON MI.restaurantNo = R.restaurantID 
            WHERE R.restaurantName = '{restaurant_name}' AND R.city = '{city}'
            """
        executeSelect(updated_query)
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        conn.rollback()

def main():
    mysql_username = 'dkp001'
    mysql_password = 'aMaeli6m'
    open_database('localhost', mysql_username, mysql_password, mysql_username)
    
    while True:
        print("\nMenu of operations:")
        print("1) Find all available menu items at any restaurant")
        print("2) Order an available menu item from a particular restaurant")
        print("3) List all food orders for a particular restaurant")
        print("4) Cancel a food order")
        print("5) Add a new dish for a restaurant")
        print("6) Quit")
        choice = input("Enter your choice (1-6): ")
        
        if choice == '1':
            find_menu_items()
        elif choice == '2':
            pass
            order_menu_item()
        elif choice == '3':
            pass
            list_food_orders()
        elif choice == '4':
            pass
            cancel_food_order()
        elif choice == '5':
            pass
            add_new_dish()
        elif choice == '6':
            close_db()
            print("Exiting program. Goodbye!")
            break
        else:
            print("Invalid choice. Please enter a number between 1 and 6.")

if __name__ == "__main__":
    main()