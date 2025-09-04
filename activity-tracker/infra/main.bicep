@description('The location where the resources will be created.')
param location string = resourceGroup().location

@description('The environment name. Used to name resources.')
param environmentName string

@description('The name of the container registry to store images.')
param containerRegistryName string = 'cr${replace(environmentName, '-', '')}'

@description('Tags for the resources.')
param tags object = {
  'azd-env-name': environmentName
}

var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))

// Container Registry
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: containerRegistryName
  location: location
  tags: tags
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// Database
resource postgresql 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01' = {
  name: 'psql-${resourceToken}'
  location: location
  tags: tags
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '15'
    administratorLogin: 'psqladmin'
    administratorLoginPassword: 'P@ssw0rd1234'  // Change this in production
    storage: {
      storageSizeGB: 32
    }
  }
}

// Backend Container App Environment
resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: 'env-${resourceToken}'
  location: location
  tags: tags
  properties: {
    workloadProfiles: [
      {
        workloadProfileType: 'Consumption'
        name: 'Consumption'
      }
    ]
  }
}

// Backend Container App
resource backendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'backend-${resourceToken}'
  location: location
  tags: tags
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3001
      }
      secrets: [
        {
          name: 'database-url'
          value: 'postgresql://psqladmin:P@ssw0rd1234@${postgresql.properties.fullyQualifiedDomainName}:5432/activitydb'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'backend'
          image: '${containerRegistry.properties.loginServer}/backend:latest'
          env: [
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
            {
              name: 'PORT'
              value: '3001'
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 10
      }
    }
  }
}

// Frontend Static Web App
resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: 'stapp-${resourceToken}'
  location: location
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    provider: 'Custom'
    repositoryUrl: ''
    branch: 'main'
    buildProperties: {
      apiLocation: 'api'
      appLocation: 'frontend'
    }
  }
}

output BACKEND_URI string = backendApp.properties.configuration.ingress.fqdn
output FRONTEND_URI string = staticWebApp.properties.defaultHostname
output POSTGRESQL_FQDN string = postgresql.properties.fullyQualifiedDomainName
