@echo off
cd /d C:\Users\admin\.openclaw\workspace
start "OpenClaw Status" cmd /k "openclaw status"
openclaw gateway
