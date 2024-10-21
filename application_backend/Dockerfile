# Usa la imagen oficial de MySQL versión 8
FROM mysql:8

# Establece las variables de entorno para la configuración de MySQL
ENV MYSQL_ROOT_PASSWORD=manguito
ENV MYSQL_DATABASE=TO_DO_List
ENV MYSQL_USER=manguito_user
ENV MYSQL_PASSWORD=manguito

# Copia el archivo de configuración de MySQL
COPY my.cnf /etc/mysql/conf.d/

# Cambia el método de autenticación por defecto
##CMD ["mysqld", "--default-authentication-plugin=caching_sha2_password"]

# Expone el puerto de MySQL
EXPOSE 3306