# domosed-ts
 Typescript библиотека для работы с API сервиса «Домосед»

# Установка
```
npm i domosed-ts
```
```
yarn add domosed-ts
```

# Использование
Пример на Typescript (для Javascript тоже самое, но без типов):
```typescript
import { 
  Domosed, DomosedOptions, ServerOptions, IncomingPayment, 
  MerchantInfo, Payment, UsersBalance 
} from 'domosed-ts';

const options: DomosedOptions = {
  // Токен для доступа к API
  token: 'myDomosedToken',
  
  // Необязательные параметры
  // URL REST API сервера, в случае если нужно заменить стандартный
  apiUrl: 'https://api.domosed.com/',
  // callback-функция, вызывающаяся при входящем платеже - аналог domosed.onPayment, но сразу в опциях
  onPayment: (payment: IncomingPayment) => { /* code */ }
};

const serverOptions: ServerOptions = {
  // Адрес сервера, куда будут поступать запросы
  // URL и порт не совмещаются в коде, так как часто требуется проксирование через NGINX
  // Здесь (в примере) предусмотрено, что стоит NGINX с proxy_pass на 3000 порт и SSL-сертификатом
  url: 'https://test.domosed.com/transfer',
  // Путь для POST запросов
  path: '/transfer',
  // Порт для сервера
  port: 3000
};

async function run() {
  // Создаем инстанс класса Domosed
  const ds: Domosed = new Domosed(options);

  // Подписка на входящие платежы и старт прослушивания
  // Библиотека автоматически сверяет хэш входящих запросов для защиты от взлома
  ds.onPayment((payment: IncomingPayment) => console.log(payment));
  await ds.start(serverOptions);

  // Делаем универсальный вызов любого метода
  // T - возвращаемый тип функции Promise<T>
  // В данном случае метод редактирования информации о проекте
  const response: string = await ds.call<string>(
    'merchants.edit', 
    { name: 'Имя', avatar: 'Ссылка на аватар', group_id: 1 }
  );
  console.log(response); // => 'New parametrs updated'
  
  // Вызов метода получения информации о проекте
  const merchantInfo: MerchantInfo = await ds.getMerchantInfo();
  console.log(merchantInfo); // => MerchantInfo

  // Вызов метода редактирования информации о проекте
  const editResponse: string = await ds.editMerchantInfo({
    name: 'Имя', 
    avatar: 'Ссылка на аватар', 
    group_id: 0 
  });
  console.log(editResponse); // => 'New parametrs updated'
  
  // Вызов метода для модерации проекта
  const verifyResponse: string = await ds.sendVerify();
  console.log(verifyResponse); // => 'Your project has applied for moderation, please wait moderator answer'

  // Вызов метода перевода монет пользователю
  // Переводим пользователю id1 (Павлу Дурову) 100 монет
  const paymentResponse: Payment = await ds.sendPayment(1, 100);
  console.log(paymentResponse); // => Payment
  
  // Получаем историю переводов
  // Всех переводов в количестве 50 штук (максимум)
  const payments: Payment[] = await ds.getPaymentsHistory('all', 50);
  console.log(payments); // => Payment[]

  // Получаем балансы Павла Дурова и Дани Рубцова
  const balances: UsersBalance = await ds.getBalance([1, 73845201]);
  console.log(balances); // => UsersBalance
  
  // Получаем ссылку для перевода проекту
  const link: string = await ds.getPaymentLink();
  console.log(link); // => 'https://vk.com/app7594692#transfer-0'
}

run();
```

# Ошибки
Все ошибки выбрасываются в консоль. При этом отображается код ошибки и сообщение об ошибке.

# Разработчик
Разработчик данной библиотеки (немного измененной версии для TS) - ItzNeviKat. <br/>
Разработчик оригинальной библиотеки - ub1x.