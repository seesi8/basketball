import requests
import time

def generate_19_digit_numbers():
    """
    Generator that yields all 19-digit numbers starting with '1' and ending with '0'.
    """
    start = 10**18  # Smallest 19-digit number starting with 1
    end = 2 * 10**18  # Largest 19-digit number starting with 1 (exclusive)
    for number in range(start, end, 10):  # Step by 10 to ensure the number ends with 0
        yield number

t0 = time.time()

# Example usage:
gen = generate_19_digit_numbers()
for n in gen:  # Generate the first 10 numbers
    
    try:

        num = n
        
        if (num % 100) == 0:
            t1 = time.time()

            print(num)
            total = t1-t0
            print(total)
            
            t0 = time.time()


        url = f"https://api.sleeper.app/v1/draft/{num}/picks"

        res = requests.get(url)
        
        json = res.json()

        if(json != None):
            print("success!")
            with open(f"./temp/{num}", "w") as file:
                file.write(json)
                
    except Exception as e:
        print(e)