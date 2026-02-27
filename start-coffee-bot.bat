@echo off
cd /d C:\Users\admin\.openclaw\workspace
start http://localhost:4173
node projects\coffee-bot\app\server.mjs
