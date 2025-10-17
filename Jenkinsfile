pipeline {
    agent any

    environment {
        IMAGE_NAME = 'login-app'
        IMAGE_TAG = 'v1.0.4'
        HOST_PORT = '8086'
        CONTAINER_PORT = '8085'
        CONTAINER_CPU = '0.5'
        CONTAINER_MEMORY = '512m'
        DOCKER_HUB_CREDENTIALS_ID = 'DOCKERHUB_CREDENTIALS'
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Checking out repository..."
                git url: 'https://github.com/akhilsathyan07/login-application.git', branch: 'main'
            }
        }

        stage('Check Docker CLI') {
            steps {
                echo "Verifying Docker CLI..."
                sh '''
                    if command -v docker &> /dev/null; then
                        echo "✅ Docker CLI found:"
                        docker --version
                    else
                        echo "❌ Docker CLI not found. Please fix your Jenkins container setup."
                        exit 1
                    fi
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image..."
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
            }
        }

        stage('Login & Push Docker Image') {
            steps {
                echo "Logging into Docker Hub and pushing image..."
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKER_HUB_CREDENTIALS_ID}", 
                    usernameVariable: 'DOCKER_HUB_USER', 
                    passwordVariable: 'DOCKER_HUB_PASS'
                )]) {
                    sh '''
                        echo $DOCKER_HUB_PASS | docker login -u $DOCKER_HUB_USER --password-stdin
                        docker tag ${IMAGE_NAME}:${IMAGE_TAG} $DOCKER_HUB_USER/${IMAGE_NAME}:${IMAGE_TAG}
                        docker push $DOCKER_HUB_USER/${IMAGE_NAME}:${IMAGE_TAG}
                    '''
                }
            }
        }

        stage('Deploy on Local Docker Host') {
            steps {
                echo "Deploying container on local Docker host..."
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKER_HUB_CREDENTIALS_ID}", 
                    usernameVariable: 'DOCKER_HUB_USER', 
                    passwordVariable: 'DOCKER_HUB_PASS'
                )]) {
                    sh '''
                        # Stop & remove old container if exists
                        if [ $(docker ps -aq -f name=${IMAGE_NAME}) ]; then
                            docker stop ${IMAGE_NAME} || true
                            docker rm ${IMAGE_NAME} || true
                        fi

                        # Run new container with CPU & memory limits
                        docker run -d --name ${IMAGE_NAME} \
                            --cpus=${CONTAINER_CPU} \
                            --memory=${CONTAINER_MEMORY} \
                            -p ${HOST_PORT}:${CONTAINER_PORT} \
                            $DOCKER_HUB_USER/${IMAGE_NAME}:${IMAGE_TAG}
                    '''
                }
            }
        }
    }

    post {
        always {
            echo "Cleaning up unused Docker resources..."
            sh '''
                if command -v docker &> /dev/null; then
                    docker container prune -f
                    docker image prune -af
                    docker network prune -f
                else
                    echo "Docker CLI not found, skipping cleanup."
                fi
            '''
        }
        success {
            echo "✅ Pipeline completed successfully!"
        }
        failure {
            echo "❌ Pipeline failed. Please check the logs."
        }
    }
}
