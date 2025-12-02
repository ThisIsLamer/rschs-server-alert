import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  message!: string;

  @Column('datetime')
  date!: Date

  @Column({ type: 'text', length: 5 })
  type!: string

  @CreateDateColumn()
  createdAt!: Date;
}
