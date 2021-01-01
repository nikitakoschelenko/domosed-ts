import Koa, { Context } from 'koa';
import Router from '@koa/router';
import koaBody from 'koa-body';

import crypto from 'crypto';
import fetch from 'node-fetch';

import { DomosedOptions, ServerOptions, MerchantInfo, Payment, UsersBalance, IncomingPayment } from './interfaces';
import { PaymentsHistoryType } from './types';
import { APIError } from './errors';

/*
 * URL для API Домоседа по умолчанию
 */
const DEFAULT_API_URL = 'https://domosed.danyarub.ru/api/';

/*
 * Domosed класс
 */
export class Domosed {
  private options: DomosedOptions;
  private app?: Koa<Context>;
  private router?: Router;

  constructor(options: DomosedOptions) {
    if (!options.apiUrl) options.apiUrl = DEFAULT_API_URL;

    this.options = options;
  }

  /**
   * @param method - Название метода
   * @param params - Параметры метода
   * @description Вызов любого метода API
   * @returns - Ответ на запрос к API
   */
  async call<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    const response = await fetch(
      this.options.apiUrl + method,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ access_token: this.options.token, ...params })
      }
    );
    const data = await response.json();
    if (data.error || !data.response) throw new APIError(data.error.error_code, data.error.error_msg);

    return data.response.msg;
  }

  /**
   * @description Вернет информацию о Вашем проекте
   * @returns Информация о проекте
   */
  getMerchantInfo(): Promise<MerchantInfo> {
    return this.call<MerchantInfo>('merchants.getInfo');
  }

  /**
   * @param name - Новое имя проекта
   * @param avatar - Прямая ссылка на новый аватар проекта
   * @param group_id - ID нового сообщества проекта
   * @description Редактирует данные проекта
   * @returns Возвращает строку "New parametrs updated", если успешно
   */
  editMerchantInfo(
    { name, avatar, group_id }: { name: string, avatar: string, group_id: number }
  ): Promise<string> {
    return this.call<string>('merchants.edit', { name, avatar, group_id });
  }

  /**
   * @description Отправляет проект на модерацию
   * @returns Возвращает строку "Your project has applied for moderation, please wait moderator answer", если успешно
   */
  sendVerify(): Promise<string> {
    return this.call<string>('merchants.sendVerify');
  }

  /**
   * @param toId - ID пользователя
   * @param amount - Количество монет
   * @description Совершает перевод монет указанному пользователю
   * @returns Объект перевода
   */
  sendPayment(toId: number, amount: number): Promise<Payment> {
    return this.call<Payment>('payment.send', { toId, amount });
  }

  /**
   * @param type - Тип возвращаемых переводов
   * @param limit - Количество возвращаемых переводов, от 1 до 50
   * @description Возвращает историю платежей
   * @returns Массив объектов платежей
   */
  getPaymentsHistory(type: PaymentsHistoryType, limit: number): Promise<Payment[]> {
    return this.call<Payment[]>('payment.getHistory', { type, limit });
  }

  /**
   * @param userIds - ID пользователя или несколько ID пользователей
   * @description Получит баланс выбранных пользователей (не более 20)
   * @returns Объект с ID's пользователей и их балансами
   */
  getBalance(userIds: number | number[]): Promise<UsersBalance> {
    return this.call<UsersBalance>('users.getBalance', { userIds });
  }

  /**
   * @description Получает ссылку для перевода монет
   * @returns Ссылка на перевод монет проекту
   */
  async getPaymentLink(): Promise<string> {
    const { id } = await this.getMerchantInfo();

    return 'https://vk.com/app7594692#transfer-' + id;
  }

  /**
   * @description Callback входящих переводов
   */
  onPayment(callback: (payment: IncomingPayment) => void): void {
    this.options.onPayment = callback;
  }

  /**
   * @param url - Адрес для прихода платежей
   * @param path - Путь для POST запроса (начинается с '/')
   * @param port - Прослушиваемый порт (НЕ добавляется в конец адреса`)
   * @description Запускает прослушивание входящих переводов
   */
  async start(
    { url, path, port }: ServerOptions
  ): Promise<void> {
    await this.call('merchants.webhook.set', { url });

    this.app = new Koa<Context>();
    this.app.use(koaBody());

    this.router = new Router<Context>();
    this.router.post(path, (ctx: Context) => {
      const body: IncomingPayment = ctx.request.body;

      const hash = body.hash;
      const generatedHash = crypto
        .createHash('md5')
        .update(this.options.token + body.amount + body.fromId)
        .digest('hex');

      if (hash !== generatedHash) return ctx.status = 400;

      if (this.options.onPayment) this.options.onPayment(body);

      return ctx.body = 'ok';
    });

    this.app.use(this.router.routes());

    return new Promise<void>(resolve => this.app?.listen(port, resolve));
  }
}
