pipeline {
    agent any
    
    triggers {
        pollSCM('H/5 * * * *')
    }

    environment {
        DOCKER_HUB_USERNAME = credentials('DOCKER_HUB_USERNAME')
        DOCKER_HUB_TOKEN    = credentials('DOCKER_HUB_TOKEN')
    }

    stages {
        
        stage('Build All Services') {
            parallel {
                stage('Eureka')      { steps { buildService('VMS-EUREKA-SERVER') } }
                stage('Gateway')     { steps { buildService('VMS-API-GATEWAY')  } }
                stage('Auth')        { steps { buildService('VMS-AUTH')         } }
                stage('Vendor')      { steps { buildService('VMS-VENDOR')       } }
                stage('Orders')      { steps { buildService('VMS-ORDERS')       } }
                stage('Payments')    { steps { buildService('VMS-PAYMENTS')     } }
                stage('Document')    { steps { buildService('VMS-DOCUMENT')     } }
                stage('Dashboard')   { steps { buildService('VMS-DASHBOARD')    } }
                stage('Performance') { steps { buildService('VMS-PERFORMANCE')  } }
            }
        }

        stage('Push Docker Images') {
            parallel {
                stage('Push Eureka')      { steps { pushImage('vms-eureka-server', 'VMS-EUREKA-SERVER') } }
                stage('Push Gateway')     { steps { pushImage('vms-api-gateway',  'VMS-API-GATEWAY')   } }
                stage('Push Auth')        { steps { pushImage('vms-auth',         'VMS-AUTH')          } }
                stage('Push Vendor')      { steps { pushImage('vms-vendor',       'VMS-VENDOR')        } }
                stage('Push Orders')      { steps { pushImage('vms-orders',       'VMS-ORDERS')        } }
                stage('Push Payments')    { steps { pushImage('vms-payments',     'VMS-PAYMENTS')      } }
                stage('Push Document')    { steps { pushImage('vms-document',     'VMS-DOCUMENT')      } }
                stage('Push Dashboard')   { steps { pushImage('vms-dashboard',    'VMS-DASHBOARD')     } }
                stage('Push Performance') { steps { pushImage('vms-performance',  'VMS-PERFORMANCE')   } }
            }
        }

        stage('Deploy to Render') {
            steps {
                script {
                    def services = [
                        'vms-eureka', 'vms-gateway', 'vms-auth', 'vms-vendor',
                        'vms-orders', 'vms-payments', 'vms-document',
                        'vms-dashboard', 'vms-performance', 'vms-frontend'
                    ]
                    services.each { service ->
                        def hookUrl = env."RENDER_DEPLOY_HOOK_${service.toUpperCase().replace('-', '_')}"
                        if (hookUrl) {
                            sh "curl -s -X POST '$hookUrl'"
                            echo "Triggered deploy for $service"
                        }
                    }
                }
            }
        }
    }
}

def buildService(String dir) {
    dir(dir) {
        sh 'mvn clean package -DskipTests'
    }
}

def pushImage(String name, String dir) {
    dir(dir) {
        sh """
            docker build -t ${DOCKER_HUB_USERNAME}/$name:latest .
            echo "$DOCKER_HUB_TOKEN" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin
            docker push ${DOCKER_HUB_USERNAME}/$name:latest
        """
    }
}
