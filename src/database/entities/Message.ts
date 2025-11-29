import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  content!: string;

  @Column('datetime')
  messageDate!: Date

  @Column({ type: 'text', length: 5 })
  type!: string

  @CreateDateColumn()
  createdAt!: Date;
}
