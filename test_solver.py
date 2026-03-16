from solver import solve
import time

board = [
[5,3,0,0,7,0,0,0,0],
[6,0,0,1,9,5,0,0,0],
[0,9,8,0,0,0,0,6,0],
[8,0,0,0,6,0,0,0,3],
[4,0,0,8,0,3,0,0,1],
[7,0,0,0,2,0,0,0,6],
[0,6,0,0,0,0,2,8,0],
[0,0,0,4,1,9,0,0,5],
[0,0,0,0,8,0,0,7,9]
]

start = time.time()

solve(board)

end = time.time()

for i, row in enumerate(board):

    if i % 3 == 0 and i != 0:
        print("- - - - - - - - - - -")

    for j, num in enumerate(row):

        if j % 3 == 0 and j != 0:
            print("|", end=" ")

        print(num, end=" ")

    print()

print("\nSolved in:", end - start, "seconds")