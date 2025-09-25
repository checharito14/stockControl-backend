
# Stock Control Web - Backend

Este proyecto es el backend de una aplicación de control de stock, desarrollado con NestJS, TypeORM y JWT para autenticación.

## Características principales
- API RESTful para gestión de usuarios y autenticación
- Seguridad con JWT
- Integración con base de datos mediante TypeORM
- Estructura modular y escalable

## Estructura del proyecto
```
eslint.config.mjs
nest-cli.json
package.json
README.md
tsconfig.build.json
tsconfig.json
src/
  app.controller.ts
  app.module.ts
  app.service.ts
  main.ts
  auth/
    auth.controller.ts
    auth.module.ts
    auth.service.ts
    constants.ts
    dto/
      login.dto.ts
      register-user.dto.ts
    entities/
      auth.entity.ts
  common/
    utils/
      utils.ts
  config/
    typeorm.config.ts
  users/
    users.module.ts
    users.service.ts
    dto/
      create-user.dto.ts
    entities/
      user.entity.ts
```

## Uso

- El backend expone endpoints para autenticación y gestión de usuarios.
- La autenticación se realiza mediante JWT.
- Puedes probar los endpoints usando herramientas como Postman o Insomnia.

## To Do (funcionalidades por agregar)

- [ ] Agregar guards a rutas 



---

Desarrollado con ❤️ usando NestJS.
