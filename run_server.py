import os
import sys
import subprocess

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    venv_dir = os.path.join(base_dir, "venv")
    
    if sys.platform == "win32":
        python_executable = os.path.join(venv_dir, "Scripts", "python.exe")
    else:
        python_executable = os.path.join(venv_dir, "bin", "python")
    # 1234567890
    # Create virtual environment if it doesn't exist
    if not os.path.exists(python_executable):
        print(f"Creating virtual environment in {venv_dir}...")
        subprocess.run([sys.executable, "-m", "venv", venv_dir], check=True)
        print("Installing dependencies...")
        req_file = os.path.join(base_dir, "backend", "requirements.txt")
        subprocess.run([python_executable, "-m", "pip", "install", "-r", req_file], check=True)

    print("\n" + "="*50)
    print(" 🚀 Starting Vanilla JS + FastAPI Omok Game Server")
    print(" 🌐 Access URL: http://localhost:8000/")
    print("="*50 + "\n")

    # Launch uvicorn server
    cmd = [python_executable, "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
    subprocess.run(cmd)

if __name__ == "__main__":
    main()
