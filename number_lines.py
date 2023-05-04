'''
Prompt sequence
----
1. write a python script that takes a text in stdin and output the lines one by one preceded by numbering , with a dot and a space
2. there is no #2 ;)
        
'''
import sys

def number_lines(text):
    lines = text.split('\n')
    for i, line in enumerate(lines):
        print(f"{i+1}. {line}")

if __name__ == '__main__':
    text = sys.stdin.read()
    number_lines(text)
