#!/bin/bash

# Simple docker manager for flash sale system
# Usage: ./docker-manager.sh [start|stop|logs|status|clean|help]

set -e

check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "Error: Docker is not running"
        exit 1
    fi
}

show_help() {
    cat << EOF
Flash Sale Docker Manager

Usage: 
  ./docker-manager.sh <command>

Commands:
  start         Start all services (MongoDB, Redis, Backend, Frontend)
  start-infra   Start only MongoDB and Redis
  stop          Stop all services
  restart       Restart all services
  build         Rebuild all images
  logs          View logs
  status        Check service status
  clean         Remove all containers and volumes (WARNING: deletes all data)
  help          Show this message

Examples:
  ./docker-manager.sh start
  ./docker-manager.sh start-infra
  ./docker-manager.sh status
  ./docker-manager.sh logs

EOF
}

case "$1" in
    start)
        echo "Starting services..."
        check_docker
        docker-compose up --build -d
        
        echo "Waiting for services to initialize..."
        sleep 5
        
        echo ""
        echo "Services started successfully!"
        echo ""
        echo "Access URLs:"
        echo "  Frontend: http://localhost:3000"
        echo "  Backend:  http://localhost:5000"
        echo "  Admin:    http://localhost:3000/admin"
        echo ""
        ;;
    
    start-infra)
        echo "Starting infrastructure services (MongoDB & Redis)..."
        check_docker
        docker-compose up mongodb redis -d
        
        echo "Waiting for services to be ready..."
        sleep 5
        
        echo ""
        echo "Infrastructure services started!"
        echo "Now you can run: npm run install:all && npm run dev"
        echo "Note that the first build may takes 5-10 minutes. Environment variables are pre-configured"
        echo ""
        ;;
    
    stop)
        echo "Stopping services..."
        docker-compose down
        echo "Services stopped"
        ;;
    
    restart)
        echo "Restarting services..."
        docker-compose restart
        echo "Services restarted"
        ;;
    
    build)
        echo "Building images..."
        check_docker
        docker-compose build --no-cache
        echo "Build complete"
        ;;
    
    logs)
        echo "Showing logs (press Ctrl+C to exit)"
        echo ""
        docker-compose logs -f
        ;;
    
    status)
        echo "Service Status:"
        echo ""
        docker-compose ps
        ;;
    
    clean)
        echo "WARNING: This will delete all containers, volumes, and data!"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down -v
            echo "Cleanup complete"
        else
            echo "Cancelled"
        fi
        ;;
    
    help|--help|-h|"")
        show_help
        ;;
    
    *)
        echo "Error: Unknown command '$1'"
        echo ""
        show_help
        exit 1
        ;;
esac
